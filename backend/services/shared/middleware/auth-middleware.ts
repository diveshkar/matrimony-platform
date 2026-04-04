import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { UnauthorizedError } from '../errors/app-errors.js';

export interface AuthenticatedEvent extends APIGatewayProxyEventV2 {
  auth: {
    userId: string;
    email?: string;
    phone?: string;
  };
}

type AuthenticatedHandler = (
  event: AuthenticatedEvent,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

type LambdaHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

export function withAuth(handler: AuthenticatedHandler): LambdaHandler {
  return async (event, context) => {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    // In production, this validates the JWT via Cognito JWKS.
    // For local dev, we extract claims from the API Gateway authorizer context.
    const authorizer = (event.requestContext as unknown as Record<string, unknown>)?.authorizer as
      | { jwt?: { claims?: Record<string, unknown> } }
      | undefined;
    const claims = authorizer?.jwt?.claims;

    if (!claims?.sub) {
      throw new UnauthorizedError('Invalid token claims');
    }

    const authenticatedEvent = event as AuthenticatedEvent;
    authenticatedEvent.auth = {
      userId: claims.sub as string,
      email: claims.email as string | undefined,
      phone: claims.phone_number as string | undefined,
    };

    return handler(authenticatedEvent, context);
  };
}
