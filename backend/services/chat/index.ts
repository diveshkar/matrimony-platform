import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as getConversations } from './handlers/get-conversations.js';
import { main as createConversation } from './handlers/create-conversation.js';
import { main as getMessages } from './handlers/get-messages.js';
import { main as sendMessage } from './handlers/send-message.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'GET /chats': getConversations,
  'POST /chats': createConversation,
  'GET /chats/{conversationId}/messages': getMessages,
  'POST /chats/{conversationId}/messages': sendMessage,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
