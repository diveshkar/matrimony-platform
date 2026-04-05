import jwt from 'jsonwebtoken';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AuthRepository } from '../repositories/auth-repository.js';
import {
  ValidationError,
  UnauthorizedError,
  RateLimitError,
} from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';

const isDev = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
const JWT_SECRET = process.env.JWT_SECRET || (isDev ? 'dev-secret-do-not-use-in-prod' : '');
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required in stage/prod');
const JWT_ISSUER = 'matrimony-api';

function createToken(claims: Record<string, string>, expiresInMinutes: number): string {
  return jwt.sign(claims, JWT_SECRET, {
    expiresIn: `${expiresInMinutes}m`,
    issuer: JWT_ISSUER,
  });
}

function verifyToken(token: string): Record<string, unknown> {
  return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as Record<string, unknown>;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const isLocal = process.env.ENVIRONMENT === 'dev';
  if (isLocal) {
    logger.info('OTP (dev mode)', { email, otp });
    return;
  }

  const ses = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@matrimony.com';

  await ses.send(
    new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Your Matrimony Login Code' },
        Body: {
          Html: {
            Data: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #8B1A4A;">Matrimony</h2>
                <p>Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 8px; margin: 16px 0;">
                  ${otp}
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
              </div>
            `,
          },
          Text: { Data: `Your Matrimony verification code is: ${otp}. It expires in 5 minutes.` },
        },
      },
    }),
  );
}

export class AuthService {
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  async startAuth(email: string): Promise<{ message: string; identifier: string }> {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const existing = await this.repo.getOtp(email);
    if (existing) {
      const now = Math.floor(Date.now() / 1000);
      const secondsSinceCreation = now - Math.floor(new Date(existing.createdAt).getTime() / 1000);
      if (secondsSinceCreation < 60) {
        throw new RateLimitError('Please wait 60 seconds before requesting a new OTP');
      }
    }

    const otp = generateOtp();
    await this.repo.storeOtp(email, 'email', otp);
    await sendOtpEmail(email, otp);

    return {
      message: 'OTP sent to email',
      identifier: email,
    };
  }

  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      matrimonyId: string;
      hasProfile: boolean;
      onboardingComplete: boolean;
    };
    isNewUser: boolean;
  }> {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const record = await this.repo.getOtp(email);
    if (!record) {
      throw new ValidationError('No OTP found. Please request a new one.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > record.expiresAt) {
      await this.repo.deleteOtp(email);
      throw new ValidationError('OTP has expired. Please request a new one.');
    }

    if (record.attempts >= 5) {
      await this.repo.deleteOtp(email);
      throw new RateLimitError('Too many failed attempts. Please request a new OTP.');
    }

    if (record.otp !== otp) {
      await this.repo.incrementOtpAttempts(email);
      throw new ValidationError('Invalid OTP. Please try again.');
    }

    await this.repo.deleteOtp(email);

    let account = await this.repo.findAccountByEmail(email);
    let isNewUser = false;

    if (!account) {
      account = await this.repo.createAccount(undefined, email);
      isNewUser = true;
      logger.info('New account created', { userId: account.userId });
    }

    const tokenClaims = {
      sub: account.userId,
      email: account.email || '',
    };

    const accessToken = createToken(tokenClaims, 60);
    const refreshToken = createToken({ sub: account.userId, type: 'refresh' }, 43200);

    await this.repo.updateRefreshToken(account.userId, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: account.userId,
        email: account.email || email,
        matrimonyId: account.matrimonyId,
        hasProfile: account.hasProfile,
        onboardingComplete: account.onboardingComplete,
      },
      isNewUser,
    };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let claims: Record<string, unknown>;
    try {
      claims = verifyToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token. Please log in again.');
    }

    if (!claims.sub) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const account = await this.repo.getAccount(claims.sub as string);
    if (!account || account.accountStatus !== 'active') {
      throw new UnauthorizedError('Account not found or inactive');
    }

    if (account.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Refresh token revoked');
    }

    const tokenClaims = {
      sub: account.userId,
      email: account.email || '',
    };

    const newAccessToken = createToken(tokenClaims, 60);
    const newRefreshToken = createToken({ sub: account.userId, type: 'refresh' }, 43200);

    await this.repo.updateRefreshToken(account.userId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.repo.clearRefreshToken(userId);
  }

  async getMe(userId: string): Promise<{
    id: string;
    email: string;
    matrimonyId: string;
    hasProfile: boolean;
    onboardingComplete: boolean;
  }> {
    const account = await this.repo.getAccount(userId);
    if (!account) {
      throw new UnauthorizedError('Account not found');
    }

    return {
      id: account.userId,
      email: account.email || '',
      matrimonyId: account.matrimonyId,
      hasProfile: account.hasProfile,
      onboardingComplete: account.onboardingComplete,
    };
  }
}
