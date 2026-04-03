/**
 * Local development server — wraps Lambda handlers as Express routes.
 * Run: pnpm dev:backend (or: npx tsx watch services/dev-server.ts)
 */

// Load .env file for local secrets (Stripe keys, etc.)
try {
  const { readFileSync: readF } = await import('fs');
  const { resolve: res, dirname: dir } = await import('path');
  const { fileURLToPath: toPath } = await import('url');
  const envPath = res(dir(toPath(import.meta.url)), '..', '.env');
  for (const line of readF(envPath, 'utf-8').split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key?.trim() && vals.length) process.env[key.trim()] = vals.join('=').trim();
  }
} catch { /* .env file not found — use defaults */ }

// Set env vars before any imports so DynamoDB client picks them up
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
process.env.AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
process.env.AWS_ACCESS_KEY_ID = 'fakeMyKeyId';
process.env.AWS_SECRET_ACCESS_KEY = 'fakeSecretAccessKey';
process.env.AWS_SESSION_TOKEN = '';
process.env.ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
// Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env file
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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
import { main as createProfileHandler } from './profile/handlers/create-profile.js';
import { main as getMyProfileHandler } from './profile/handlers/get-my-profile.js';
import { main as updateProfileHandler } from './profile/handlers/update-profile.js';
import { main as getProfileHandler } from './profile/handlers/get-profile.js';
import { main as getUploadUrlHandler } from './uploads/handlers/get-upload-url.js';
import { main as confirmUploadHandler } from './uploads/handlers/confirm-upload.js';
import { main as getPhotosHandler } from './uploads/handlers/get-photos.js';
import { main as updatePhotoHandler } from './uploads/handlers/update-photo.js';
import { main as deletePhotoHandler } from './uploads/handlers/delete-photo.js';
import { main as getRecommendationsHandler } from './discovery/handlers/get-recommendations.js';
import { main as searchProfilesHandler } from './discovery/handlers/search-profiles.js';
import { main as sendInterestHandler } from './interests/handlers/send-interest.js';
import { main as respondInterestHandler } from './interests/handlers/respond-interest.js';
import { main as getInterestsHandler } from './interests/handlers/get-interests.js';
import { main as shortlistHandler } from './interests/handlers/shortlist.js';
import { main as getConversationsHandler } from './chat/handlers/get-conversations.js';
import { main as getMessagesHandler } from './chat/handlers/get-messages.js';
import { main as sendMessageHandler } from './chat/handlers/send-message.js';
import { main as createConversationHandler } from './chat/handlers/create-conversation.js';
import { main as getPlansHandler } from './subscriptions/handlers/get-plans.js';
import { main as createCheckoutHandler } from './subscriptions/handlers/create-checkout.js';
import { main as webhookHandler } from './subscriptions/handlers/webhook.js';
import { main as getMySubscriptionHandler } from './subscriptions/handlers/get-my-subscription.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads-local');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

route('post', '/profiles', createProfileHandler);
route('get', '/me', getMyProfileHandler);
route('patch', '/me', updateProfileHandler);
route('get', '/profiles/:id', getProfileHandler);

route('post', '/uploads/photo-url', getUploadUrlHandler);
route('post', '/uploads/photo-confirm', confirmUploadHandler);
route('get', '/uploads/photos', getPhotosHandler);
route('patch', '/uploads/photos/:photoId', updatePhotoHandler);
route('delete', '/uploads/photos/:photoId', deletePhotoHandler);

// Local file upload — saves to disk, returns URL (replaces S3 in dev)
app.post('/uploads/file', express.raw({ type: ['image/*'], limit: '5mb' }), (req, res) => {
  const ext = (req.headers['content-type'] || 'image/jpeg').split('/')[1] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(filePath, req.body);
  const url = `http://localhost:${PORT}/uploads/local/${fileName}`;
  res.json({ success: true, data: { url, fileName } });
});

// Serve local uploaded files
app.use('/uploads/local', express.static(UPLOADS_DIR));

route('get', '/discover', getRecommendationsHandler);
route('get', '/discover/search', searchProfilesHandler);

route('post', '/interests', sendInterestHandler);
route('post', '/interests/:senderId/respond', respondInterestHandler);
route('get', '/interests', getInterestsHandler);
route('get', '/shortlist', shortlistHandler);
route('post', '/shortlist', shortlistHandler);
route('delete', '/shortlist/:userId', shortlistHandler);

route('get', '/chats', getConversationsHandler);
route('post', '/chats', createConversationHandler);
route('get', '/chats/:conversationId/messages', getMessagesHandler);
route('post', '/chats/:conversationId/messages', sendMessageHandler);

route('get', '/subscriptions/plans', getPlansHandler);
route('post', '/subscriptions/checkout', createCheckoutHandler);
route('post', '/subscriptions/webhook', webhookHandler);
route('get', '/subscriptions/me', getMySubscriptionHandler);

// ── Start ───────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🚀 Backend dev server running at http://localhost:${PORT}`);
  console.log(`  📋 Health check: http://localhost:${PORT}/health\n`);
});
