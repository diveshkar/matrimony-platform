import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';

const coreRepo = new BaseRepository('core');
const discoveryRepo = new BaseRepository('discovery');
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { data: Record<string, unknown>; at: number } | null = null;

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return success(cached.data, requestId);
  }

  const [allProfiles, allStories] = await Promise.all([
    discoveryRepo.query<{ country?: string }>('DISCOVERY#ALL', { limit: 1000 }),
    coreRepo.query<{ status?: string }>('SUCCESS_STORIES', { limit: 500 }),
  ]);

  const totalProfiles = allProfiles.items.length;
  const successStories = allStories.items.filter(s => s.status === 'approved').length;

  const countries = new Set<string>();
  for (const item of allProfiles.items) {
    if (item.country) countries.add(item.country);
  }

  const stats = {
    totalProfiles,
    successfulMatches: successStories,
    countriesReached: countries.size,
    verifiedPercentage: totalProfiles > 0 ? 100 : 0,
  };

  cached = { data: stats, at: Date.now() };

  return success(stats, requestId);
}

export const main = createHandler(handler);
