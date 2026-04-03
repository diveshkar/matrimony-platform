import { AuthRepository, type AccountRecord } from '../repositories/auth-repository.js';
import { ValidationError, UnauthorizedError, RateLimitError } from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * In production, tokens would be issued by Cognito.
 * For local dev, we create base64-encoded JSON tokens.
 */
function createDevToken(claims: Record<string, string>, expiresInMinutes: number): string {
  const payload = {
    ...claims,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class AuthService {
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  async startAuth(phone?: string, email?: string): Promise<{ message: string; identifier: string }> {
    const identifier = phone || email;
    if (!identifier) {
      throw new ValidationError('Phone or email is required');
    }

    // Check rate limit — max 5 OTPs per identifier per hour
    const existing = await this.repo.getOtp(identifier);
    if (existing) {
      const now = Math.floor(Date.now() / 1000);
      const secondsSinceCreation = now - Math.floor(new Date(existing.createdAt).getTime() / 1000);
      if (secondsSinceCreation < 60) {
        throw new RateLimitError('Please wait 60 seconds before requesting a new OTP');
      }
    }

    const otp = generateOtp();
    await this.repo.storeOtp(identifier, phone ? 'phone' : 'email', otp);

    // In production: send OTP via SNS (phone) or SES (email)
    // For local dev: log the OTP
    logger.info('OTP generated (dev mode)', { identifier, otp });

    return {
      message: `OTP sent to ${phone ? 'phone' : 'email'}`,
      identifier,
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
      throw new RateLimitError('Too many failed attempts. Please request a new OTP.');
    }

    if (record.otp !== otp) {
      await this.repo.incrementOtpAttempts(identifier);
      throw new ValidationError('Invalid OTP. Please try again.');
    }

    // OTP verified — clean up
    await this.repo.deleteOtp(identifier);

    // Find or create account
    let account: AccountRecord | null = null;
    let isNewUser = false;

    if (phone) {
      account = await this.repo.findAccountByPhone(phone);
    } else if (email) {
      account = await this.repo.findAccountByEmail(email);
    }

    if (!account) {
      account = await this.repo.createAccount(phone, email);
      isNewUser = true;
      logger.info('New account created', { userId: account.userId });
    }

    // Create tokens
    const tokenClaims = {
      sub: account.userId,
      phone_number: account.phone || '',
      email: account.email || '',
    };

    const accessToken = createDevToken(tokenClaims, 60); // 1 hour
    const refreshToken = createDevToken({ sub: account.userId, type: 'refresh' }, 43200); // 30 days

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
    // Decode refresh token
    let claims: Record<string, string>;
    try {
      const decoded = Buffer.from(refreshToken, 'base64').toString('utf-8');
      claims = JSON.parse(decoded);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (!claims.sub) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && Number(claims.exp) < now) {
      throw new UnauthorizedError('Refresh token expired. Please log in again.');
    }

    const account = await this.repo.getAccount(claims.sub);
    if (!account || account.accountStatus !== 'active') {
      throw new UnauthorizedError('Account not found or inactive');
    }

    if (account.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Refresh token revoked');
    }

    const tokenClaims = {
      sub: account.userId,
      phone_number: account.phone || '',
      email: account.email || '',
    };

    const newAccessToken = createDevToken(tokenClaims, 60);
    const newRefreshToken = createDevToken({ sub: account.userId, type: 'refresh' }, 43200);

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
