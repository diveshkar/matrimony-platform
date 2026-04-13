import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError, RateLimitError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { validatePhoneNumber } from '../domain/phone-validation.js';
import { ensurePhoneAvailable, registerPhone } from '../domain/phone-registry.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { sendSmsOtp } from '../../auth/domain/sms-otp.js';
import { nowISO } from '../../shared/utils/date.js';
import { generateOtp } from '../../shared/utils/id-generator.js';

const coreRepo = new BaseRepository('core');

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const body = parseBody(event);
  const { phoneNumber, action, otp } = body;

  if (!phoneNumber) throw new ValidationError('phoneNumber is required');

  // ── ACTION: send-otp (validate + send SMS code) ─────────
  if (!action || action === 'send-otp') {
    // 1. Check uniqueness
    await ensurePhoneAvailable(phoneNumber, userId);

    // 2. Validate format + Twilio carrier check
    const result = await validatePhoneNumber(phoneNumber);

    // 3. Check cooldown
    const existingOtp = await coreRepo.get<{ createdAt: string }>(
      `PHONEOTP#${phoneNumber}`,
      'PENDING#v1',
    );
    if (existingOtp) {
      const secondsSince = Math.floor(
        (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000,
      );
      if (secondsSince < 60) {
        throw new RateLimitError('Please wait 60 seconds before requesting a new code');
      }
    }

    // 4. Generate and store OTP
    const code = generateOtp();
    const now = Math.floor(Date.now() / 1000);
    await coreRepo.put({
      PK: `PHONEOTP#${phoneNumber}`,
      SK: 'PENDING#v1',
      otp: code,
      userId,
      phoneNumber,
      attempts: 0,
      expiresAt: now + 300,
      createdAt: nowISO(),
      ttl: now + 600,
    });

    // 5. Send SMS
    await sendSmsOtp(phoneNumber, code);

    return success({
      status: 'otp_sent',
      phone: result.phone,
      country: result.country,
      carrierType: result.carrierType,
    }, requestId);
  }

  // ── ACTION: verify-otp (check SMS code) ─────────────────
  if (action === 'verify-otp') {
    if (!otp || otp.length !== 6) throw new ValidationError('6-digit code is required');

    const record = await coreRepo.get<{
      otp: string;
      userId: string;
      attempts: number;
      expiresAt: number;
    }>(`PHONEOTP#${phoneNumber}`, 'PENDING#v1');

    if (!record) throw new ValidationError('No code found. Please request a new one.');

    const now = Math.floor(Date.now() / 1000);
    if (now > record.expiresAt) {
      await coreRepo.delete(`PHONEOTP#${phoneNumber}`, 'PENDING#v1');
      throw new ValidationError('Code expired. Please request a new one.');
    }

    if (record.attempts >= 5) {
      await coreRepo.delete(`PHONEOTP#${phoneNumber}`, 'PENDING#v1');
      throw new RateLimitError('Too many failed attempts. Please request a new code.');
    }

    if (record.otp !== otp) {
      await coreRepo.update(`PHONEOTP#${phoneNumber}`, 'PENDING#v1', {
        attempts: record.attempts + 1,
      });
      throw new ValidationError('Invalid code. Please try again.');
    }

    // OTP matches — register phone
    await coreRepo.delete(`PHONEOTP#${phoneNumber}`, 'PENDING#v1');
    await registerPhone(userId, phoneNumber);

    return success({ status: 'verified', phone: phoneNumber }, requestId);
  }

  throw new ValidationError('Invalid action. Use send-otp or verify-otp.');
}

export const main = createHandler(withAuth(handler));
