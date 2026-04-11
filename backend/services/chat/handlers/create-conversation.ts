import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError, ForbiddenError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { ChatService } from '../domain/chat-service.js';
import { checkEntitlement } from '../../shared/middleware/entitlement-check.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';

const chatService = new ChatService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = parseBody(event);
  if (!body.otherUserId) throw new ValidationError('otherUserId is required');

  await checkEntitlement(authedEvent.auth.userId, 'chat_access');

  const coreRepo = new BaseRepository('core');
  const sentInterest = await coreRepo.get<{ status: string }>(
    `USER#${authedEvent.auth.userId}`,
    `INTEREST#OUT#${body.otherUserId}`,
  );
  const receivedInterest = await coreRepo.get<{ status: string }>(
    `USER#${authedEvent.auth.userId}`,
    `INTEREST#IN#${body.otherUserId}`,
  );
  const hasAccepted = sentInterest?.status === 'accepted' || receivedInterest?.status === 'accepted';
  if (!hasAccepted) {
    throw new ForbiddenError('You can only chat with accepted interests');
  }

  const result = await chatService.createConversation(authedEvent.auth.userId, body.otherUserId);

  return success(result, requestId, 201);
}

export const main = createHandler(withAuth(handler));
