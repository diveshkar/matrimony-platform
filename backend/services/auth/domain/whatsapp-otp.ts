import { logger } from '../../shared/utils/logger.js';

/**
 * Send OTP via Twilio WhatsApp API.
 *
 * Uses the same TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN as phone validation.
 * Twilio has a pre-approved WhatsApp sandbox for testing.
 *
 * Setup:
 *   1. Go to twilio.com/console/sms/whatsapp/sandbox
 *   2. Join sandbox by sending "join <your-sandbox-word>" from your WhatsApp
 *   3. Set TWILIO_WHATSAPP_FROM in env (e.g., "whatsapp:+14155238886")
 *
 * For production:
 *   1. Request a Twilio WhatsApp sender number
 *   2. Get message template approved
 *   3. Update TWILIO_WHATSAPP_FROM to your production number
 */
export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const isLocal = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
  const forceReal = process.env.FORCE_REAL_OTP === 'true';

  if (isLocal && !forceReal) {
    logger.info('WhatsApp OTP (dev mode)', { phone, otp });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required for WhatsApp OTP');
  }

  const toNumber = `whatsapp:${phone}`;
  const body = `Your Matrimony verification code is ${otp}. It expires in 5 minutes.`;

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
        From: fromNumber,
        To: toNumber,
        Body: body,
      }).toString(),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Twilio WhatsApp OTP failed', { phone, status: response.status, error: errorBody });
    throw new Error('Failed to send WhatsApp OTP. Please try again or use email.');
  }

  logger.info('WhatsApp OTP sent via Twilio', { phone });
}
