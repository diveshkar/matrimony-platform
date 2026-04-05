import jwt from 'jsonwebtoken';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { UnauthorizedError } from '../errors/app-errors.js';

const isDev = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
const JWT_SECRET = process.env.JWT_SECRET || (isDev ? 'dev-secret-do-not-use-in-prod' : '');
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required in stage/prod');
const JWT_ISSUER = 'matrimony-api';

export interface AuthenticatedEvent extends APIGatewayProxyEventV2 {
  auth: {
    userId: string;
    email?: string;
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

    const token = authHeader.slice(7);

    let claims: Record<string, unknown>;
    try {
      claims = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    if (!claims.sub) {
      throw new UnauthorizedError('Invalid token claims');
    }

    const authenticatedEvent = event as AuthenticatedEvent;
    authenticatedEvent.auth = {
      userId: claims.sub as string,
      email: (claims.email as string) || undefined,
    };

    return handler(authenticatedEvent, context);
  };
}
