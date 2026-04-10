import { BaseRepository } from '../../shared/repositories/base-repository.js';

// ═══════════════════════════════════════════════════════════════
// TIERED SEEN TRACKING
// viewed: 3 days, declined: 30 days, matched: permanent
// ═══════════════════════════════════════════════════════════════

export type SeenAction = 'viewed' | 'declined' | 'matched';

export interface SeenEntry {
  action: SeenAction;
  at: string; // ISO timestamp
}

interface SeenCooldownRecord {
  PK: string;
  SK: string;
  entries: Record<string, SeenEntry>;
}

const COOLDOWN_MS: Record<SeenAction, number> = {
  viewed: 3 * 24 * 60 * 60 * 1000,    // 3 days
  declined: 30 * 24 * 60 * 60 * 1000,  // 30 days
  matched: Infinity,                     // permanent
};

// Higher number = higher priority — never downgrade an action
const ACTION_PRIORITY: Record<SeenAction, number> = {
  viewed: 1,
  declined: 2,
  matched: 3,
};

const SEEN_SK = 'SEEN#COOLDOWN';

/**
 * Check whether a single entry's cooldown is still active.
 */
function isOnCooldown(entry: SeenEntry, now: number): boolean {
  if (entry.action === 'matched') return true;
  const elapsed = now - new Date(entry.at).getTime();
  return elapsed < COOLDOWN_MS[entry.action];
}

/**
 * Prune expired entries from the record to keep DynamoDB item size manageable.
 * Returns a new entries map with only active cooldowns.
 */
function pruneExpired(entries: Record<string, SeenEntry>, now: number): Record<string, SeenEntry> {
  const pruned: Record<string, SeenEntry> = {};
  for (const [userId, entry] of Object.entries(entries)) {
    if (isOnCooldown(entry, now)) {
      pruned[userId] = entry;
    }
  }
  return pruned;
}

/**
 * Get the set of user IDs currently on cooldown for a given viewer.
 * Also prunes expired entries and writes back if any were removed.
 */
export async function getActiveCooldowns(
  coreRepo: BaseRepository,
  userId: string,
): Promise<Set<string>> {
  const record = await coreRepo.get<SeenCooldownRecord>(`USER#${userId}`, SEEN_SK);
  if (!record?.entries) return new Set();

  const now = Date.now();
  const activeIds = new Set<string>();

  for (const [targetId, entry] of Object.entries(record.entries)) {
    if (isOnCooldown(entry, now)) {
      activeIds.add(targetId);
    }
  }

  // Prune in background if >10% of entries are expired (don't block the read)
  const totalEntries = Object.keys(record.entries).length;
  if (totalEntries > activeIds.size && totalEntries - activeIds.size > totalEntries * 0.1) {
    const pruned = pruneExpired(record.entries, now);
    coreRepo.put({
      PK: `USER#${userId}`,
      SK: SEEN_SK,
      entries: pruned,
    }).catch(() => { /* fire-and-forget prune */ });
  }

  return activeIds;
}

/**
 * Record a seen action for a single target profile.
 * Respects action priority — never downgrades (e.g. matched → viewed).
 */
export async function recordSeenAction(
  coreRepo: BaseRepository,
  userId: string,
  targetUserId: string,
  action: SeenAction,
): Promise<void> {
  const record = await coreRepo.get<SeenCooldownRecord>(`USER#${userId}`, SEEN_SK);
  const entries = record?.entries ? { ...record.entries } : {};
  const now = Date.now();

  // Check existing — don't downgrade action priority
  const existing = entries[targetUserId];
  if (existing) {
    const existingPriority = ACTION_PRIORITY[existing.action];
    const newPriority = ACTION_PRIORITY[action];
    if (newPriority < existingPriority) return; // don't downgrade
    // Same or higher priority: update timestamp and action
  }

  entries[targetUserId] = { action, at: new Date().toISOString() };

  // Prune expired entries on every write to prevent unbounded growth
  const cleaned = pruneExpired(entries, now);

  await coreRepo.put({
    PK: `USER#${userId}`,
    SK: SEEN_SK,
    entries: cleaned,
  });
}

/**
 * Record matched action for BOTH users (mutual exclusion).
 * Called when an interest is accepted — both sides should never see each other in discovery again.
 */
export async function recordMutualMatch(
  coreRepo: BaseRepository,
  userA: string,
  userB: string,
): Promise<void> {
  await Promise.all([
    recordSeenAction(coreRepo, userA, userB, 'matched'),
    recordSeenAction(coreRepo, userB, userA, 'matched'),
  ]);
}
