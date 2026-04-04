import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ChatService } from '../domain/chat-service.js';

const chatService = new ChatService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const result = await chatService.getMyConversations(authedEvent.auth.userId);

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
