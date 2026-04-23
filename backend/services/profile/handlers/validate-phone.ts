import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { validatePhoneNumber } from '../domain/phone-validation.js';
import { ensurePhoneAvailable, registerPhone } from '../domain/phone-registry.js';
import { startPhoneVerification, checkPhoneVerification } from '../../auth/domain/sms-otp.js';

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const body = parseBody(event);
  const { phoneNumber, action, otp } = body;

  if (!phoneNumber) throw new ValidationError('phoneNumber is required');

  // ── ACTION: send-otp (validate + start Twilio Verify) ─────────
  if (!action || action === 'send-otp') {
    // 1. Check uniqueness (business rule — no two users with same phone)
    await ensurePhoneAvailable(phoneNumber, userId);

    // 2. Validate format + Twilio Lookup (VOIP detection)
    const result = await validatePhoneNumber(phoneNumber);

    // 3. Start Twilio Verify — Twilio handles OTP generation, storage,
    //    rate limiting, expiry, delivery, and attempt counting.
    await startPhoneVerification(phoneNumber);

    return success({
      status: 'otp_sent',
      phone: result.phone,
      country: result.country,
      carrierType: result.carrierType,
    }, requestId);
  }

  // ── ACTION: verify-otp (check via Twilio Verify) ────────────
  if (action === 'verify-otp') {
    if (!otp || otp.length !== 6) throw new ValidationError('6-digit code is required');

    const approved = await checkPhoneVerification(phoneNumber, otp);

    if (!approved) {
      throw new ValidationError('Invalid or expired code. Please try again or request a new one.');
    }

    // Code approved — link phone to this user
    await registerPhone(userId, phoneNumber);

    return success({ status: 'verified', phone: phoneNumber }, requestId);
  }

  throw new ValidationError('Invalid action. Use send-otp or verify-otp.');
}

export const main = createHandler(withAuth(handler));
