import { BaseRepository } from '../../shared/repositories/base-repository.js';

export interface DiscoveryContext {
  matchScore: number;
  rank: number;
}

interface LatestPointer {
  snapshotId: string;
}

interface SnapshotWithScores {
  rankedUserIds: string[];
  scores: Record<string, number>;
}

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
