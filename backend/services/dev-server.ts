/**
 * Local development server — wraps Lambda handlers as Express routes.
 * Run: pnpm dev:backend (or: npx tsx watch services/dev-server.ts)
 */

// Set env vars before any imports so DynamoDB client picks them up
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
process.env.AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
process.env.AWS_ACCESS_KEY_ID = 'fakeMyKeyId';
process.env.AWS_SECRET_ACCESS_KEY = 'fakeSecretAccessKey';
process.env.AWS_SESSION_TOKEN = '';
process.env.ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
process.env.USE_MEMORY_STORE = 'false';

import express from 'express';
import cors from 'cors';
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2, type Context } from 'aws-lambda';

// Force reset DynamoDB client so it picks up the env vars above
import { resetClient } from './shared/repositories/dynamodb-client.js';
resetClient();

// Handlers
import { main as healthHandler } from './health/handlers/health-check.js';
import { main as authStartHandler } from './auth/handlers/auth-start.js';
import { main as authVerifyHandler } from './auth/handlers/auth-verify.js';
import { main as authRefreshHandler } from './auth/handlers/auth-refresh.js';
import { main as authLogoutHandler } from './auth/handlers/auth-logout.js';
import { main as authMeHandler } from './auth/handlers/auth-me.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000' }));
app.use(express.json());

// Build a fake API Gateway event from an Express request
function buildEvent(req: express.Request): APIGatewayProxyEventV2 {
  const authHeader = req.headers.authorization || '';
  return {
    version: '2.0',
    routeKey: `${req.method} ${req.path}`,
    rawPath: req.path,
    rawQueryString: new URLSearchParams(req.query as Record<string, string>).toString(),
    headers: req.headers as Record<string, string>,
    queryStringParameters: req.query as Record<string, string>,
    body: req.body ? JSON.stringify(req.body) : undefined,
    isBase64Encoded: false,
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      domainName: 'localhost',
      domainPrefix: 'localhost',
      http: {
        method: req.method,
        path: req.path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
      },
      requestId: `local-${Date.now()}`,
      routeKey: `${req.method} ${req.path}`,
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
      // Simulate JWT authorizer if Bearer token is present
      ...(authHeader.startsWith('Bearer ') && {
        authorizer: {
          jwt: {
            claims: parseDevToken(authHeader.replace('Bearer ', '')),
            scopes: [],
          },
        },
      }),
    },
    pathParameters: req.params,
  } as unknown as APIGatewayProxyEventV2;
}

/**
 * In dev mode, the token IS the JSON claims (base64-encoded).
 * This lets us skip real Cognito validation locally.
 */
function parseDevToken(token: string): Record<string, string> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

const fakeContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'local',
  functionVersion: '1',
  invokedFunctionArn: 'local',
  memoryLimitInMB: '256',
  awsRequestId: `local-${Date.now()}`,
  logGroupName: 'local',
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

type LambdaHandler = (event: APIGatewayProxyEventV2, context: Context) => Promise<APIGatewayProxyResultV2>;

function route(method: 'get' | 'post' | 'patch' | 'delete', path: string, handler: LambdaHandler) {
  app[method](path, async (req: express.Request, res: express.Response) => {
    try {
      const event = buildEvent(req);
      const result = await handler(event, { ...fakeContext, awsRequestId: `local-${Date.now()}` });

      if (typeof result === 'string') {
        res.status(200).send(result);
        return;
      }

      const statusCode = result.statusCode || 200;
      const headers = result.headers || {};
      const body = result.body ? JSON.parse(result.body) : {};

      Object.entries(headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'access-control-allow-origin' && typeof value === 'string') {
          res.setHeader(key, value);
        }
      });

      res.status(statusCode).json(body);
    } catch (err) {
      console.error('Handler error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  });
}

// ── Routes ──────────────────────────────────

route('get', '/health', healthHandler);
route('post', '/auth/start', authStartHandler);
route('post', '/auth/verify', authVerifyHandler);
route('post', '/auth/refresh', authRefreshHandler);
route('post', '/auth/logout', authLogoutHandler);
route('get', '/auth/me', authMeHandler);

// ── Start ───────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🚀 Backend dev server running at http://localhost:${PORT}`);
  console.log(`  📋 Health check: http://localhost:${PORT}/health\n`);
});
