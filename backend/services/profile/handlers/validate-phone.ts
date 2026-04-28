import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { validatePhoneNumber } from '../domain/phone-validation.js';
import { ensurePhoneAvailable, registerPhone } from '../domain/phone-registry.js';
import { startPhoneVerification, checkPhoneVerification } from '../../auth/domain/sms-otp.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { logger } from '../../shared/utils/logger.js';
import { nowISO } from '../../shared/utils/date.js';

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

    // Code approved — link phone to this user.
    //
    // Three writes happen here, in order:
    //   1. registerPhone — writes USER#{userId}/PHONE#{phone} + GSI1 index
    //      (this is the lookup record other login flows use)
    //   2. ACCOUNT#v1.phone update — `phoneVerified` in the discovery
    //      projection reads from this field. Without this update,
    //      email-signup users who verify a phone here would still show
    //      as not-phone-verified in matches/search.
    //   3. syncProfileToDiscovery — re-build the projection so the new
    //      phoneVerified=true reflects in feeds. No-ops gracefully if
    //      the user hasn't completed onboarding yet (the profile sync
    //      also runs at the end of createProfile and will reconcile).
    await registerPhone(userId, phoneNumber);

    const coreRepo = new BaseRepository('core');
    await coreRepo.update(`USER#${userId}`, 'ACCOUNT#v1', {
      phone: phoneNumber,
      updatedAt: nowISO(),
    });

    try {
      const { DiscoveryService } = await import('../../discovery/domain/discovery-service.js');
      await new DiscoveryService().syncProfileToDiscovery(userId);
    } catch (err) {
      // Best-effort — projection sync is non-critical. The next legitimate
      // sync trigger (profile edit, photo change, etc.) will reconcile.
      logger.warn('Failed to sync discovery projection after phone verification', {
        userId,
        error: String(err),
      });
    }

    return success({ status: 'verified', phone: phoneNumber }, requestId);
  }

  throw new ValidationError('Invalid action. Use send-otp or verify-otp.');
}

export const main = createHandler(withAuth(handler));
