import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { ConflictError } from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';

const coreRepo = new BaseRepository('core');

/**
 * Phone Registry — manages phone number uniqueness and index records in DynamoDB.
 *
 * Records:
 *   PK: USER#{userId}  SK: PHONE#{phone}     — user's phone record
 *   GSI1PK: PHONE#{phone}  GSI1SK: USER#{userId} — lookup index (for uniqueness + login)
 *
 * Rules:
 *   - One phone number per account (unique across all users)
 *   - WhatsApp login users already have phone on account — skip re-validation
 *   - When phone changes, old index deleted, new index created
 */

/**
 * Check if a phone number is already registered to another user.
 * Returns the userId of the owner if taken, null if available.
 */
export async function findPhoneOwner(phone: string): Promise<string | null> {
  const result = await coreRepo.query<{ userId: string }>(`PHONE#${phone}`, {
    indexName: 'GSI1',
    limit: 1,
  });
  return result.items[0]?.userId || null;
}

/**
 * Ensure a phone number is not already taken by another user.
 * Throws ConflictError if taken.
 * Returns silently if available or already owned by the same user.
 */
export async function ensurePhoneAvailable(phone: string, userId: string): Promise<void> {
  const owner = await findPhoneOwner(phone);

  if (owner && owner !== userId) {
    throw new ConflictError('This phone number is already registered with another account.');
  }
}

/**
 * Register a phone number for a user.
 * Creates the PHONE# index record in DynamoDB.
 * Checks uniqueness before creating.
 */
export async function registerPhone(userId: string, phone: string): Promise<void> {
  await ensurePhoneAvailable(phone, userId);

  await coreRepo.put({
    PK: `USER#${userId}`,
    SK: `PHONE#${phone}`,
    GSI1PK: `PHONE#${phone}`,
    GSI1SK: `USER#${userId}`,
    userId,
    phone,
    verifiedAt: new Date().toISOString(),
  });

  logger.info('Phone registered', { userId, phone });
}

/**
 * Unregister a phone number for a user.
 * Deletes the PHONE# index record from DynamoDB.
 */
export async function unregisterPhone(userId: string, phone: string): Promise<void> {
  await coreRepo.delete(`USER#${userId}`, `PHONE#${phone}`);
  logger.info('Phone unregistered', { userId, phone });
}

/**
 * Change a user's phone number.
 * Validates uniqueness of the new number, deletes old index, creates new index.
 * Updates the account record.
 */
export async function changePhone(
  userId: string,
  oldPhone: string | undefined,
  newPhone: string,
): Promise<void> {
  await ensurePhoneAvailable(newPhone, userId);

  if (oldPhone && oldPhone !== newPhone) {
    await unregisterPhone(userId, oldPhone);
  }

  await registerPhone(userId, newPhone);

  await coreRepo.update(`USER#${userId}`, 'ACCOUNT#v1', {
    phone: newPhone,
    updatedAt: new Date().toISOString(),
  });

  logger.info('Phone changed', { userId, oldPhone, newPhone });
}

/**
 * Check if a user already has a verified phone number.
 */
export async function getUserPhone(userId: string): Promise<string | undefined> {
  const account = await coreRepo.get<{ phone?: string }>(`USER#${userId}`, 'ACCOUNT#v1');
  return account?.phone;
}
