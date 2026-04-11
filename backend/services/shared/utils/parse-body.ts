import type { APIGatewayProxyEventV2 } from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseBody(event: APIGatewayProxyEventV2): any {
  if (!event.body) return {};

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
