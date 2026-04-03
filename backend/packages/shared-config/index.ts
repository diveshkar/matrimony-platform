import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENVIRONMENT: z.enum(['dev', 'stage', 'prod']).default('dev'),
  AWS_REGION: z.string().default('ap-south-1'),
  DYNAMODB_ENDPOINT: z.string().optional(),
  COGNITO_USER_POOL_ID: z.string().default(''),
  COGNITO_CLIENT_ID: z.string().default(''),
  SES_FROM_EMAIL: z.string().email().default('noreply@example.com'),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  S3_MEDIA_BUCKET: z.string().default('matrimony-media-dev'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = envSchema.parse(process.env);
  return cachedConfig;
}

export const TABLE_NAMES = {
  CORE: 'core',
  MESSAGES: 'messages',
  DISCOVERY: 'discovery',
  EVENTS: 'events',
} as const;

export const RATE_LIMITS = {
  OTP: { action: 'otp', maxAttempts: 5, windowMinutes: 60 },
  INTEREST: { action: 'interest', maxAttempts: 50, windowMinutes: 60 },
  MESSAGE: { action: 'message', maxAttempts: 30, windowMinutes: 60 },
  PROFILE_VIEW: { action: 'profile_view', maxAttempts: 100, windowMinutes: 60 },
} as const;
