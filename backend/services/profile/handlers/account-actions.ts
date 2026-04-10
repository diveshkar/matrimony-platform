import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { logger } from '../../shared/utils/logger.js';

const coreRepo = new BaseRepository('core');

// ═══════════════════════════════════════════════════════════════
// POST /me/deactivate — Hide profile from all discovery/search
// POST /me/reactivate — Make profile visible again
// DELETE /me — Permanently delete account and all data
// ═══════════════════════════════════════════════════════════════

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

/**
 * Deactivate: set showInSearch=false and remove discovery projection.
 * Profile, interests, conversations, subscription all remain intact.
 * User can reactivate by calling POST /me/reactivate.
 */
async function handleDeactivate(userId: string, requestId: string) {
  // Update privacy setting
  await coreRepo.update(`USER#${userId}`, 'PRIVACY#v1', {
    showInSearch: false,
  });

  // Remove from discovery index so they don't appear in anyone's feed
  try {
    const { DiscoveryService } = await import('../../discovery/domain/discovery-service.js');
    await new DiscoveryService().syncProfileToDiscovery(userId);
  } catch (err) {
    logger.warn('Failed to remove discovery projection on deactivate', { userId, error: String(err) });
  }

  return success({ status: 'deactivated' }, requestId);
}

/**
 * Reactivate: set showInSearch=true and re-sync discovery projection.
 */
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

/**
 * Delete account: permanently remove all user data.
 * Order matters — cancel subscription first (stops billing), then delete data.
 */
async function handleDeleteAccount(userId: string, requestId: string) {
  // 1. Cancel active subscription (stop billing before deleting records)
  try {
    const { SubscriptionRepository } = await import('../../subscriptions/repositories/subscription-repository.js');
    const subRepo = new SubscriptionRepository();
    const sub = await subRepo.getSubscription(userId);
    if (sub?.status === 'active' && sub.stripeSubscriptionId) {
      const { SubscriptionService } = await import('../../subscriptions/domain/subscription-service.js');
      const subService = new SubscriptionService();
      await subService.cancelSubscription(userId);
    }
  } catch (err) {
    logger.warn('Failed to cancel subscription during account delete', { userId, error: String(err) });
  }

  // 2. Remove from discovery index
  try {
    const { DiscoveryRepository } = await import('../../discovery/repositories/discovery-repository.js');
    const discoveryRepo = new DiscoveryRepository();
    await discoveryRepo.removeProjection(userId);
  } catch (err) {
    logger.warn('Failed to remove discovery projection on delete', { userId, error: String(err) });
  }

  // 3. Unregister phone number (free it up for other accounts)
  try {
    const { getUserPhone, unregisterPhone } = await import('../domain/phone-registry.js');
    const phone = await getUserPhone(userId);
    if (phone) {
      await unregisterPhone(userId, phone);
    }
  } catch (err) {
    logger.warn('Failed to unregister phone on delete', { userId, error: String(err) });
  }

  // 4. Delete all user records from core table
  // Query all items under USER#{userId} and delete them
  try {
    let lastKey: Record<string, unknown> | undefined;
    do {
      const result = await coreRepo.query<{ PK: string; SK: string }>(
        `USER#${userId}`,
        { limit: 100, exclusiveStartKey: lastKey },
      );

      for (const item of result.items) {
        await coreRepo.delete(item.PK, item.SK);
      }

      lastKey = result.lastKey;
    } while (lastKey);
  } catch (err) {
    logger.warn('Failed to delete user records', { userId, error: String(err) });
  }

  // 5. Delete profile projection record
  try {
    await coreRepo.delete(`PROFILE#${userId}`, 'DISCOVERY#v1');
  } catch (err) {
    logger.warn('Failed to delete profile projection', { userId, error: String(err) });
  }

  // 6. Delete account record (this effectively logs the user out — JWT will fail on next request)
  try {
    await coreRepo.delete(`USER#${userId}`, 'ACCOUNT#v1');
  } catch (err) {
    logger.warn('Failed to delete account record', { userId, error: String(err) });
  }

  logger.info('Account permanently deleted', { userId });

  return success({ status: 'deleted' }, requestId);
}

export const main = createHandler(withAuth(handler));
