import { logger } from '../../shared/utils/logger.js';

// ──────────────────────────────────────────────────────────────────
// Phone Verification via Twilio Verify
// https://www.twilio.com/docs/verify/api
// Twilio handles OTP generation, storage, expiry, attempt limits, and delivery.
// ──────────────────────────────────────────────────────────────────

const TWILIO_VERIFY_BASE = 'https://verify.twilio.com/v2/Services';

function getTwilioCreds() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error(
      'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID are required',
    );
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  return { verifyServiceSid, credentials };
}

/**
 * Starts a phone verification via Twilio Verify.
 * Twilio generates the OTP, sends it, and tracks state.
 * No OTP is returned to us — user must submit the code they received.
 */
export async function startPhoneVerification(phone: string): Promise<void> {
  const isLocal = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
  const forceReal = process.env.FORCE_REAL_OTP === 'true';

  if (isLocal && !forceReal) {
    logger.info('Phone verification (dev mode — Twilio skipped)', { phone });
    // eslint-disable-next-line no-console
    console.log(`\n  [DEV] Phone verification started for ${phone} — use code 123456 in dev\n`);
    return;
  }

  const { verifyServiceSid, credentials } = getTwilioCreds();

  const response = await fetch(`${TWILIO_VERIFY_BASE}/${verifyServiceSid}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone,
      Channel: 'sms',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Twilio Verify start failed', { phone, status: response.status, body: errorBody });

    // Twilio error 60200: invalid phone number format
    if (errorBody.includes('60200')) {
      throw new Error('Invalid phone number format.');
    }
    // Twilio error 60203: max send attempts reached (rate limit)
    if (errorBody.includes('60203')) {
      throw new Error('Too many verification requests. Please wait a few minutes and try again.');
    }
    // Twilio error 60410: channel not supported for country
    if (errorBody.includes('60410')) {
      throw new Error('SMS is not supported in your country yet. Please contact support.');
    }

    throw new Error('Failed to send verification code. Please try again.');
  }

  const result = (await response.json()) as { sid?: string; status?: string };
  logger.info('Phone verification started via Twilio Verify', {
    phone,
    sid: result.sid,
    status: result.status,
  });
}

/**
 * Checks a verification code against Twilio Verify.
 * Returns true if approved, false if invalid/expired.
 */
export async function checkPhoneVerification(phone: string, code: string): Promise<boolean> {
  const isLocal = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
  const forceReal = process.env.FORCE_REAL_OTP === 'true';

  if (isLocal && !forceReal) {
    logger.info('Phone verification check (dev mode — accepts 123456)', { phone });
    return code === '123456';
  }

  const { verifyServiceSid, credentials } = getTwilioCreds();

  const response = await fetch(`${TWILIO_VERIFY_BASE}/${verifyServiceSid}/VerificationCheck`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone,
      Code: code,
    }),
  });

  // 404 = no pending verification for this phone (either expired, used, or never requested)
  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Twilio Verify check failed', { phone, status: response.status, body: errorBody });
    throw new Error('Failed to verify code. Please try again.');
  }

  const result = (await response.json()) as { status?: string };
  return result.status === 'approved';
}

// ──────────────────────────────────────────────────────────────────
// Legacy SNS implementation — commented out, kept for future re-enable
// ──────────────────────────────────────────────────────────────────
// export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
//   const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
//   const client = new SNSClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
//   await client.send(new PublishCommand({
//     PhoneNumber: phone,
//     Message: `Your verification code for The World Tamil Matrimony is ${otp}. Valid for 5 minutes.`,
//     MessageAttributes: {
//       'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
//       'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'TamilMatri' },
//     },
//   }));
// }
