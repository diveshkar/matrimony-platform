import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { logger } from '../../shared/utils/logger.js';

const coreRepo = new BaseRepository('core');

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  if (event.routeKey === 'POST /me/deactivate') {
    return handleDeactivate(userId, requestId);
  }

  if (event.routeKey === 'POST /me/reactivate') {
    return handleReactivate(userId, requestId);
  }

  if (event.routeKey === 'DELETE /me') {
    return handleDeleteAccount(userId, requestId);
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
}

async function handleDeactivate(userId: string, requestId: string) {
  await coreRepo.update(`USER#${userId}`, 'PRIVACY#v1', {
    showInSearch: false,
  });

  try {
    const { DiscoveryService } = await import('../../discovery/domain/discovery-service.js');
    await new DiscoveryService().syncProfileToDiscovery(userId);
  } catch (err) {
    logger.warn('Failed to remove discovery projection on deactivate', { userId, error: String(err) });
  }

  return success({ status: 'deactivated' }, requestId);
}

async function handleReactivate(userId: string, requestId: string) {
  await coreRepo.update(`USER#${userId}`, 'PRIVACY#v1', {
    showInSearch: true,
  });

  try {
    const { DiscoveryService } = await import('../../discovery/domain/discovery-service.js');
    await new DiscoveryService().syncProfileToDiscovery(userId);
  } catch (err) {
    logger.warn('Failed to re-sync discovery projection on reactivate', { userId, error: String(err) });
  }

  return success({ status: 'reactivated' }, requestId);
}

async function handleDeleteAccount(userId: string, requestId: string) {
  // ─── CRITICAL STEPS — fail loud ────────────────────────────────
  // If any of these fail, the account is left in a recoverable state and
  // the user gets an actionable error. Better than partial-delete limbo.

  // 1. Read account first to know what to clean up
  const account = await coreRepo.get<{ email?: string; phone?: string }>(
    `USER#${userId}`,
    'ACCOUNT#v1',
  );
  const userEmail = account?.email;
  const userPhone = account?.phone;

  // 2. Cancel active Stripe subscription. Failing here means the user
  //    would still be billed after deletion — must not proceed.
  const { SubscriptionRepository } = await import(
    '../../subscriptions/repositories/subscription-repository.js'
  );
  const subRepo = new SubscriptionRepository();
  const sub = await subRepo.getSubscription(userId);
  if (sub?.status === 'active' && sub.stripeSubscriptionId) {
    const { SubscriptionService } = await import(
      '../../subscriptions/domain/subscription-service.js'
    );
    const subService = new SubscriptionService();
    await subService.cancelSubscription(userId);
  }

  // 3. Free phone registry entry. Failing here means another user could
  //    never sign up with this phone. Must succeed before partition sweep.
  if (userPhone) {
    const { unregisterPhone } = await import('../domain/phone-registry.js');
    await unregisterPhone(userId, userPhone);
  }

  // ─── BEST-EFFORT STEPS — log and continue ──────────────────────
  // From here on, failures are logged at error level (so CloudWatch
  // alarms can fire) but don't block the user-visible delete.

  // 4. Remove discovery projection (PROFILE#v1 + DISCOVERY#ALL entry)
  try {
    const { DiscoveryRepository } = await import(
      '../../discovery/repositories/discovery-repository.js'
    );
    const discoveryRepo = new DiscoveryRepository();
    const projection = await discoveryRepo.get<{ discoveryAllSk?: string }>(
      `PROFILE#${userId}`,
      'DISCOVERY#v1',
    );
    if (projection?.discoveryAllSk) {
      try {
        await discoveryRepo.delete('DISCOVERY#ALL', projection.discoveryAllSk);
      } catch (innerErr) {
        logger.error('Failed to delete DISCOVERY#ALL entry on delete', {
          userId,
          discoveryAllSk: projection.discoveryAllSk,
          error: String(innerErr),
        });
      }
    }
    await discoveryRepo.removeProjection(userId);
  } catch (err) {
    logger.error('Failed to remove discovery projection on delete', {
      userId,
      error: String(err),
    });
  }

  // 5. Email registry record is at USER#{userId}/EMAIL#{email} and gets
  //    cleaned up automatically by the partition sweep in step 7 below.

  // 6. Clean up blocks — remove this user from others' block lists
  try {
    const blockRecord = await coreRepo.get<{ blockedUserIds?: string[] }>(
      `USER#${userId}`,
      'BLOCK',
    );
    const blockedByMe = blockRecord?.blockedUserIds || [];
    for (const otherUserId of blockedByMe) {
      try {
        const otherBlock = await coreRepo.get<{ blockedUserIds?: string[] }>(
          `USER#${otherUserId}`,
          'BLOCK',
        );
        const otherList = otherBlock?.blockedUserIds || [];
        const cleaned = otherList.filter((id) => id !== userId);
        if (cleaned.length !== otherList.length) {
          await coreRepo.update(`USER#${otherUserId}`, 'BLOCK', { blockedUserIds: cleaned });
        }
      } catch (innerErr) {
        logger.error('Failed to clean a single block reference', {
          userId,
          otherUserId,
          error: String(innerErr),
        });
      }
    }
  } catch (err) {
    logger.error('Failed to clean blocks on delete', { userId, error: String(err) });
  }

  // 7a. Delete user's S3 photo objects BEFORE the DB sweep wipes their
  //     PHOTO#* rows. Once the rows are gone we wouldn't know which
  //     keys to clean up. List-and-delete by photos/{userId}/ prefix
  //     also catches orphaned objects from failed uploads.
  try {
    const { deleteUserPhotos } = await import('../../shared/utils/s3-cleanup.js');
    await deleteUserPhotos(userId);
  } catch (err) {
    logger.error('Failed to sweep user photos from S3', { userId, error: String(err) });
  }

  // 7b. Delete ALL records under USER#{userId} partition (sweeps email
  //     registry, profile, preferences, privacy, photos, interests,
  //     shortlists, notifications, etc.)
  try {
    let lastKey: Record<string, unknown> | undefined;
    do {
      const result = await coreRepo.query<{ PK: string; SK: string }>(`USER#${userId}`, {
        limit: 100,
        exclusiveStartKey: lastKey,
      });

      for (const item of result.items) {
        await coreRepo.delete(item.PK, item.SK);
      }

      lastKey = result.lastKey;
    } while (lastKey);
  } catch (err) {
    logger.error('Failed to delete user records during sweep', { userId, error: String(err) });
  }

  // 8. Defensive: delete projection + account in case the sweep missed them
  try {
    await coreRepo.delete(`PROFILE#${userId}`, 'DISCOVERY#v1');
  } catch (err) {
    logger.error('Failed to delete profile projection', { userId, error: String(err) });
  }

  try {
    await coreRepo.delete(`USER#${userId}`, 'ACCOUNT#v1');
  } catch (err) {
    logger.error('Failed to delete account record', { userId, error: String(err) });
  }

  logger.info('Account permanently deleted', { userId, hadEmail: !!userEmail, hadPhone: !!userPhone });

  return success({ status: 'deleted' }, requestId);
}

export const main = createHandler(withAuth(handler));
