import jwt from 'jsonwebtoken';
// SES disabled — using Brevo (primary) + Resend (fallback) via email-service.
// SES can be re-enabled later if AWS approves production access.
import { AuthRepository } from '../repositories/auth-repository.js';
import { sendWhatsAppOtp } from './whatsapp-otp.js';
import { sendEmail } from '../../shared/utils/email-service.js';
import {
  ValidationError,
  UnauthorizedError,
  RateLimitError,
} from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';
import { generateOtp } from '../../shared/utils/id-generator.js';

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

// ──────────────────────────────────────────────────────────────────
// Email OTP — delegated to dual-provider email-service
// Brevo (primary, 300/day free) → Resend (fallback, 100/day free)
// 12,000 free emails/month combined.
// ──────────────────────────────────────────────────────────────────
async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const forceReal = process.env.FORCE_REAL_OTP === 'true';
  if (isDev && !forceReal) {
    logger.info('Email OTP (dev mode — check terminal)', { email });
    // eslint-disable-next-line no-console
    console.log(`\n  [DEV] Email OTP for ${email}: ${otp}\n`);
    return;
  }

  await sendEmail({
    to: email,
    subject: 'Your Login Code - The World Tamil Matrimony',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #8B1A4A;">The World Tamil Matrimony</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    `,
    text: `Your The World Tamil Matrimony verification code is: ${otp}. It expires in 5 minutes.`,
  });
}

export class AuthService {
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  async startAuth(
    phone?: string,
    email?: string,
  ): Promise<{ message: string; identifier: string; type: 'phone' | 'email' }> {
    const identifier = phone || email;
    if (!identifier) {
      throw new ValidationError('Phone or email is required');
    }

    const type: 'phone' | 'email' = phone ? 'phone' : 'email';

    const lockout = await this.repo.getLockout(identifier);
    if (lockout) {
      const remaining = Math.ceil((lockout.lockedUntil - Math.floor(Date.now() / 1000)) / 60);
      throw new RateLimitError(`Too many failed attempts. Try again in ${remaining} minutes.`);
    }

    const existing = await this.repo.getOtp(identifier);
    if (existing) {
      const now = Math.floor(Date.now() / 1000);
      const secondsSinceCreation = now - Math.floor(new Date(existing.createdAt).getTime() / 1000);
      if (secondsSinceCreation < 60) {
        throw new RateLimitError('Please wait 60 seconds before requesting a new OTP');
      }
    }

    const otp = generateOtp();
    await this.repo.storeOtp(identifier, type, otp);

    if (phone) {
      await sendWhatsAppOtp(phone, otp);
    } else if (email) {
      await sendOtpEmail(email, otp);
    }

    return {
      message: phone ? 'OTP sent to WhatsApp' : 'OTP sent to email',
      identifier,
      type,
    };
  }

  async verifyOtp(
    phone: string | undefined,
    email: string | undefined,
    otp: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      phone?: string;
      email?: string;
      matrimonyId: string;
      hasProfile: boolean;
      onboardingComplete: boolean;
    };
    isNewUser: boolean;
  }> {
    const identifier = phone || email;
    if (!identifier) {
      throw new ValidationError('Phone or email is required');
    }

    const record = await this.repo.getOtp(identifier);
    if (!record) {
      throw new ValidationError('No OTP found. Please request a new one.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > record.expiresAt) {
      await this.repo.deleteOtp(identifier);
      throw new ValidationError('OTP has expired. Please request a new one.');
    }

    if (record.attempts >= 5) {
      await this.repo.deleteOtp(identifier);
      await this.repo.setLockout(identifier, 3600);
      throw new RateLimitError('Too many failed attempts. Locked for 1 hour.');
    }

    if (record.otp !== otp) {
      await this.repo.incrementOtpAttempts(identifier);
      throw new ValidationError('Invalid OTP. Please try again.');
    }

    await this.repo.deleteOtp(identifier);

    let account = phone
      ? await this.repo.findAccountByPhone(phone)
      : await this.repo.findAccountByEmail(email!);
    let isNewUser = false;

    if (!account) {
      account = await this.repo.createAccount(phone, email);
      isNewUser = true;
      logger.info('New account created', { userId: account.userId });
    }

    const tokenClaims: Record<string, string> = {
      sub: account.userId,
    };
    if (account.email) tokenClaims.email = account.email;
    if (account.phone) tokenClaims.phone_number = account.phone;

    const accessToken = createToken(tokenClaims, 60);
    const refreshToken = createToken({ sub: account.userId, type: 'refresh' }, 43200);

    await this.repo.updateRefreshToken(account.userId, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: account.userId,
        phone: account.phone,
        email: account.email,
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

    const tokenClaims: Record<string, string> = {
      sub: account.userId,
    };
    if (account.email) tokenClaims.email = account.email;
    if (account.phone) tokenClaims.phone_number = account.phone;

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
    phone?: string;
    email?: string;
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
      phone: account.phone,
      email: account.email,
      matrimonyId: account.matrimonyId,
      hasProfile: account.hasProfile,
      onboardingComplete: account.onboardingComplete,
    };
  }
}
