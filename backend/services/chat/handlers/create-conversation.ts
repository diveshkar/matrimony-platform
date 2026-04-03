import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { ChatService } from '../domain/chat-service.js';

const chatService = new ChatService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = event.body ? JSON.parse(event.body) : {};
  if (!body.otherUserId) throw new ValidationError('otherUserId is required');

  const result = await chatService.createConversation(
    authedEvent.auth.userId,
    body.otherUserId,
  );

  return success(result, requestId, 201);
}

export const main = createHandler(withAuth(handler));
