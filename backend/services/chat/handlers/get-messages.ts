import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { ChatService } from '../domain/chat-service.js';

const chatService = new ChatService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const conversationId = event.pathParameters?.conversationId;
  if (!conversationId) throw new ValidationError('Conversation ID is required');

  const limit = Number(event.queryStringParameters?.limit) || 50;
  const cursor = event.queryStringParameters?.cursor;

  const result = await chatService.getMessages(
    authedEvent.auth.userId,
    conversationId,
    limit,
    cursor,
  );

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
