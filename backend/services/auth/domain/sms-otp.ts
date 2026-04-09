import { logger } from '../../shared/utils/logger.js';

/**
 * Send OTP via Twilio SMS.
 * Used for phone verification during onboarding (not login).
 * Same Twilio credentials as WhatsApp OTP.
 */
export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const isLocal = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
  const forceReal = process.env.FORCE_REAL_OTP === 'true' || process.env.FORCE_REAL_PHONE_VALIDATION === 'true';

  if (isLocal && !forceReal) {
    logger.info('SMS OTP (dev mode)', { phone, otp });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required for SMS OTP');
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_SMS_FROM || '+15017122661',
        To: phone,
        Body: `Your Matrimony verification code is ${otp}. It expires in 5 minutes.`,
      }).toString(),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Twilio SMS OTP failed', { phone, status: response.status, error: errorBody });
    throw new Error('Failed to send SMS. Please try again.');
  }

  logger.info('SMS OTP sent via Twilio', { phone });
}
