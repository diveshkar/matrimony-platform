import { BaseRepository } from '../../shared/repositories/base-repository.js';

/**
 * Discovery context returned for a target profile relative to a viewer's feed.
 * Used to enrich outcome records (views, interests) with algorithm metadata.
 */
export interface DiscoveryContext {
  matchScore: number;
  rank: number; // 1-based position in the ranked feed
}

interface LatestPointer {
  snapshotId: string;
}

interface SnapshotWithScores {
  rankedUserIds: string[];
  scores: Record<string, number>;
}

/**
 * Look up a target profile's score and rank from the viewer's latest discovery snapshot.
 * Returns null if no snapshot exists (expired, never built, or target wasn't in feed).
 *
 * This is a best-effort lookup — snapshot may have expired or the target may have been
 * added via search rather than discovery. Callers should treat null as "no discovery context".
 */
export async function getDiscoveryContext(
  coreRepo: BaseRepository,
  viewerId: string,
  targetUserId: string,
): Promise<DiscoveryContext | null> {
  const latest = await coreRepo.get<LatestPointer>(
    `USER#${viewerId}`,
    'SNAPSHOT#LATEST',
  );
  if (!latest?.snapshotId) return null;

  const snapshot = await coreRepo.get<SnapshotWithScores>(
    `USER#${viewerId}`,
    `SNAPSHOT#${latest.snapshotId}`,
  );
  if (!snapshot?.rankedUserIds) return null;

  const index = snapshot.rankedUserIds.indexOf(targetUserId);
  if (index === -1) return null;

  return {
    matchScore: snapshot.scores?.[targetUserId] ?? 0,
    rank: index + 1,
  };
}
