import { BaseRepository } from '../../shared/repositories/base-repository.js';

export type SeenAction = 'viewed' | 'declined' | 'matched';

export interface SeenEntry {
  action: SeenAction;
  at: string;
}

interface SeenCooldownRecord {
  PK: string;
  SK: string;
  entries: Record<string, SeenEntry>;
}

const COOLDOWN_MS: Record<SeenAction, number> = {
  viewed: 3 * 24 * 60 * 60 * 1000,
  declined: 30 * 24 * 60 * 60 * 1000,
  matched: Infinity,
};

const ACTION_PRIORITY: Record<SeenAction, number> = {
  viewed: 1,
  declined: 2,
  matched: 3,
};

const SEEN_SK = 'SEEN#COOLDOWN';

const MAX_ENTRIES = 500;

function isOnCooldown(entry: SeenEntry, now: number): boolean {
  if (entry.action === 'matched') return true;
  const elapsed = now - new Date(entry.at).getTime();
  return elapsed < COOLDOWN_MS[entry.action];
}

function pruneExpired(entries: Record<string, SeenEntry>, now: number): Record<string, SeenEntry> {
  const active: [string, SeenEntry][] = [];
  for (const [userId, entry] of Object.entries(entries)) {
    if (isOnCooldown(entry, now)) {
      active.push([userId, entry]);
    }
  }

  if (active.length > MAX_ENTRIES) {
    active.sort((a, b) => {
      const priorityA = a[1].action === 'matched' ? 0 : 1;
      const priorityB = b[1].action === 'matched' ? 0 : 1;
      if (priorityA !== priorityB) return priorityB - priorityA;
      return new Date(b[1].at).getTime() - new Date(a[1].at).getTime();
    });
    active.length = MAX_ENTRIES;
  }

  return Object.fromEntries(active);
}

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

  const totalEntries = Object.keys(record.entries).length;
  if (totalEntries > activeIds.size && totalEntries - activeIds.size > totalEntries * 0.1) {
    const pruned = pruneExpired(record.entries, now);
    coreRepo.put({
      PK: `USER#${userId}`,
      SK: SEEN_SK,
      entries: pruned,
    }).catch(() => {});
  }

  return activeIds;
}

export async function recordSeenAction(
  coreRepo: BaseRepository,
  userId: string,
  targetUserId: string,
  action: SeenAction,
): Promise<void> {
  const record = await coreRepo.get<SeenCooldownRecord>(`USER#${userId}`, SEEN_SK);
  const entries = record?.entries ? { ...record.entries } : {};
  const now = Date.now();

  const existing = entries[targetUserId];
  if (existing && ACTION_PRIORITY[action] < ACTION_PRIORITY[existing.action]) return;

  entries[targetUserId] = { action, at: new Date().toISOString() };

  const cleaned = pruneExpired(entries, now);

  await coreRepo.put({
    PK: `USER#${userId}`,
    SK: SEEN_SK,
    entries: cleaned,
  });
}

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
