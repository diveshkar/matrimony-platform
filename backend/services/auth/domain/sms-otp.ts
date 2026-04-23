import { logger } from '../../shared/utils/logger.js';

// ──────────────────────────────────────────────────────────────────
// SMS OTP via Twilio
// AWS SNS production access was rejected. Using Twilio Messaging Service.
// To switch back to SNS later: uncomment the SNS implementation below
// (kept in git history) and restore Terraform SNS resources.
// ──────────────────────────────────────────────────────────────────
export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const isLocal = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
  const forceReal = process.env.FORCE_REAL_OTP === 'true' || process.env.FORCE_REAL_PHONE_VALIDATION === 'true';

  if (isLocal && !forceReal) {
    logger.info('SMS OTP (dev mode — check terminal)', { phone });
    // eslint-disable-next-line no-console
    console.log(`\n  [DEV] SMS OTP for ${phone}: ${otp}\n`);
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || !messagingServiceSid) {
    throw new Error(
      'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID are required',
    );
  }

  const body = `Your verification code for The World Tamil Matrimony is ${otp}. Valid for 5 minutes.`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        MessagingServiceSid: messagingServiceSid,
        To: phone,
        Body: body,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Twilio SMS OTP failed', { phone, status: response.status, body: errorBody });

    // Common Twilio error codes — helpful messages for users
    if (response.status === 400 && errorBody.includes('21211')) {
      throw new Error('Invalid phone number format.');
    }
    if (response.status === 400 && errorBody.includes('21408')) {
      throw new Error('SMS sending is not enabled for this country yet.');
    }
    throw new Error('Failed to send verification code. Please try again.');
  }

  const result = (await response.json()) as { sid?: string };
  logger.info('SMS OTP sent via Twilio', { phone, messageSid: result.sid });
}

// ──────────────────────────────────────────────────────────────────
// Legacy SNS implementation — commented out, kept for future re-enable
// ──────────────────────────────────────────────────────────────────
// import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
// const client = new SNSClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
// const result = await client.send(
//   new PublishCommand({
//     PhoneNumber: phone,
//     Message: `Your verification code for The World Tamil Matrimony is ${otp}. Valid for 5 minutes.`,
//     MessageAttributes: {
//       'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
//       'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'TamilMatri' },
//     },
//   }),
// );
