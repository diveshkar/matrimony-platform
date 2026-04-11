import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError, ForbiddenError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { SafetyRepository } from '../repositories/safety-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import { generateId } from '../../shared/utils/id-generator.js';
import { logger } from '../../shared/utils/logger.js';

const coreRepo = new BaseRepository('core');
const safetyRepo = new SafetyRepository();

// GET /success-stories — public, no auth
async function getPublicStories(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;

  const result = await coreRepo.query<Record<string, unknown>>('SUCCESS_STORIES', {
    limit: 10,
    scanForward: false,
  });

  const stories = result.items
    .filter((i) => i.SK && String(i.SK).startsWith('STORY#') && i.status === 'approved')
    .map((i) => ({
      storyId: i.storyId,
      names: i.names,
      location: i.location,
      story: i.story,
      initials: i.initials,
      createdAt: i.createdAt,
    }));

  return success({ items: stories, count: stories.length }, requestId);
}

// GET /my-story — auth required, get user's submitted story
async function getMyStory(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const record = await coreRepo.get<Record<string, unknown>>(`USER#${userId}`, 'MY_STORY');

  if (!record) {
    return success({ story: null }, requestId);
  }

  return success({ story: record }, requestId);
}

// GET /my-story/matches — auth required, get accepted matches for story submission
async function getMatches(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const result = await coreRepo.query<Record<string, unknown>>(`USER#${userId}`, { limit: 200 });

  const acceptedMatches: { userId: string; name: string; photoUrl?: string }[] = [];

  for (const item of result.items) {
    const sk = String(item.SK || '');
    if ((sk.startsWith('INTEREST#OUT#') || sk.startsWith('INTEREST#IN#')) && item.status === 'accepted') {
      const matchId = sk.startsWith('INTEREST#OUT#')
        ? sk.replace('INTEREST#OUT#', '')
        : sk.replace('INTEREST#IN#', '');

      const profile = await coreRepo.get<Record<string, unknown>>(`USER#${matchId}`, 'PROFILE#v1');
      if (profile) {
        acceptedMatches.push({
          userId: matchId,
          name: profile.name as string,
          photoUrl: profile.primaryPhotoUrl as string | undefined,
        });
      }
    }
  }

  // Deduplicate (same person may appear in both OUT and IN)
  const seen = new Set<string>();
  const unique = acceptedMatches.filter((m) => {
    if (seen.has(m.userId)) return false;
    seen.add(m.userId);
    return true;
  });

  return success({ matches: unique }, requestId);
}

// POST /my-story — auth required, submit story
async function submitStory(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const body = parseBody(event);
  const { partnerId, story } = body;

  if (!partnerId) throw new ValidationError('Please select your partner');
  if (!story || story.trim().length < 20) throw new ValidationError('Story must be at least 20 characters');
  if (story.length > 2000) throw new ValidationError('Story must be under 2000 characters');

  // Check existing story
  const existing = await coreRepo.get<Record<string, unknown>>(`USER#${userId}`, 'MY_STORY');
  if (existing) throw new ValidationError('You have already submitted a story. Delete it first to submit a new one.');

  // Verify this is a real accepted match
  const sentInterest = await coreRepo.get<{ status: string }>(`USER#${userId}`, `INTEREST#OUT#${partnerId}`);
  const receivedInterest = await coreRepo.get<{ status: string }>(`USER#${userId}`, `INTEREST#IN#${partnerId}`);
  const isAccepted = sentInterest?.status === 'accepted' || receivedInterest?.status === 'accepted';
  if (!isAccepted) throw new ForbiddenError('You can only share a story with an accepted match');

  // Get both profiles for display info
  const [myProfile, partnerProfile] = await Promise.all([
    coreRepo.get<Record<string, unknown>>(`USER#${userId}`, 'PROFILE#v1'),
    coreRepo.get<Record<string, unknown>>(`USER#${partnerId}`, 'PROFILE#v1'),
  ]);

  if (!myProfile || !partnerProfile) throw new ValidationError('Both profiles must exist');

  const myName = (myProfile.name as string).split(' ')[0];
  const partnerName = (partnerProfile.name as string).split(' ')[0];
  const names = `${myName} & ${partnerName}`;
  const initials = `${myName[0]}${partnerName[0]}`;
  const location = `${myProfile.city || ''}, ${myProfile.country || ''}`.replace(/^, /, '');

  const storyId = generateId('STR');
  const now = nowISO();

  // Save on submitter's record
  await coreRepo.put({
    PK: `USER#${userId}`,
    SK: 'MY_STORY',
    storyId,
    submitterId: userId,
    partnerId,
    names,
    initials,
    location,
    story: story.trim(),
    status: 'pending_approval',
    createdAt: now,
  });

  // Save on partner's record for approval
  await coreRepo.put({
    PK: `USER#${partnerId}`,
    SK: `STORY_APPROVAL#${storyId}`,
    storyId,
    submitterId: userId,
    submitterName: myProfile.name as string,
    names,
    initials,
    location,
    story: story.trim(),
    status: 'pending',
    createdAt: now,
  });

  // Notify partner
  await safetyRepo.createNotification(partnerId, {
    type: 'story_approval',
    title: 'Share Your Love Story?',
    message: `${myName} wants to share your success story on the platform`,
    actionUrl: `/success-story/approve/${storyId}`,
  });

  logger.info('Success story submitted', { storyId, userId, partnerId });

  return success({ status: 'submitted', storyId }, requestId, 201);
}

// POST /my-story/approve — auth required, approve/decline story
async function approveStory(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const body = parseBody(event);
  const { storyId, action } = body;

  if (!storyId) throw new ValidationError('storyId is required');
  if (!action || !['approve', 'decline'].includes(action)) throw new ValidationError('action must be approve or decline');

  const approval = await coreRepo.get<Record<string, unknown>>(`USER#${userId}`, `STORY_APPROVAL#${storyId}`);
  if (!approval) throw new ValidationError('Story approval not found');
  if (approval.status !== 'pending') throw new ValidationError(`Story already ${approval.status}`);

  const submitterId = approval.submitterId as string;

  if (action === 'approve') {
    // Update approval record
    await coreRepo.update(`USER#${userId}`, `STORY_APPROVAL#${storyId}`, { status: 'approved' });

    // Update submitter's story
    await coreRepo.update(`USER#${submitterId}`, 'MY_STORY', { status: 'approved' });

    // Add to public success stories
    await coreRepo.put({
      PK: 'SUCCESS_STORIES',
      SK: `STORY#${nowISO()}#${storyId}`,
      storyId: approval.storyId,
      names: approval.names,
      initials: approval.initials,
      location: approval.location,
      story: approval.story,
      status: 'approved',
      submitterId,
      approverId: userId,
      createdAt: approval.createdAt,
      approvedAt: nowISO(),
    });

    // Notify submitter
    await safetyRepo.createNotification(submitterId, {
      type: 'story_approved',
      title: 'Your Story is Live!',
      message: 'Your success story has been approved and is now visible on the platform',
      actionUrl: '/#success-stories',
    });

    logger.info('Success story approved', { storyId, approverId: userId });
  } else {
    await coreRepo.update(`USER#${userId}`, `STORY_APPROVAL#${storyId}`, { status: 'declined' });
    await coreRepo.update(`USER#${submitterId}`, 'MY_STORY', { status: 'declined' });

    await safetyRepo.createNotification(submitterId, {
      type: 'story_declined',
      title: 'Story Not Published',
      message: 'Your partner chose not to share the success story at this time',
      actionUrl: '/settings',
    });

    logger.info('Success story declined', { storyId, declinedBy: userId });
  }

  return success({ status: action === 'approve' ? 'approved' : 'declined' }, requestId);
}

// DELETE /my-story — auth required, delete own story
async function deleteStory(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const record = await coreRepo.get<Record<string, unknown>>(`USER#${userId}`, 'MY_STORY');
  if (!record) throw new ValidationError('No story found');

  // Delete user's story record
  await coreRepo.delete(`USER#${userId}`, 'MY_STORY');

  // If approved, remove from public stories
  if (record.status === 'approved' && record.storyId) {
    const publicResult = await coreRepo.query<Record<string, unknown>>('SUCCESS_STORIES', { limit: 20 });
    const publicStory = publicResult.items.find((i) => i.storyId === record.storyId);
    if (publicStory && publicStory.SK) {
      await coreRepo.delete('SUCCESS_STORIES', publicStory.SK as string);
    }
  }

  logger.info('Success story deleted', { userId, storyId: record.storyId });

  return success({ status: 'deleted' }, requestId);
}

// Router — handles both public and auth routes
async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const method = event.requestContext?.http?.method;
  const path = event.rawPath;

  // Public route — no auth
  if (method === 'GET' && path === '/success-stories') {
    return getPublicStories(event, context);
  }

  // All other routes need auth — delegate to withAuth wrapper
  return authHandler(event, context);
}

const authHandler = withAuth(async (event: APIGatewayProxyEventV2, context: Context) => {
  const method = event.requestContext?.http?.method;
  const path = event.rawPath;

  if (method === 'GET' && path === '/my-story') return getMyStory(event, context);
  if (method === 'GET' && path === '/my-story/matches') return getMatches(event, context);
  if (method === 'POST' && path === '/my-story') return submitStory(event, context);
  if (method === 'POST' && path === '/my-story/approve') return approveStory(event, context);
  if (method === 'DELETE' && path === '/my-story') return deleteStory(event, context);

  return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
});

export const main = createHandler(handler);
