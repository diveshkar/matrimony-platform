import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { ChatService } from '../domain/chat-service.js';
import { sendMessageSchema } from '../../../packages/shared-schemas/index.js';
import { checkEntitlement } from '../../shared/middleware/entitlement-check.js';

const chatService = new ChatService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  await checkEntitlement(authedEvent.auth.userId, 'chat_access');

  const conversationId = event.pathParameters?.conversationId;
  if (!conversationId) throw new ValidationError('Conversation ID is required');

  const body = event.body ? JSON.parse(event.body) : {};
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');

  const result = await chatService.sendMessage(
    authedEvent.auth.userId,
    conversationId,
    parsed.data.content,
  );

  return success(result, requestId, 201);
}

export const main = createHandler(withAuth(handler));
