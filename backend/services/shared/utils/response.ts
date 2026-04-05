import type { APIGatewayProxyResultV2 } from 'aws-lambda';

interface SuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId: string;
}

const isDev = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGINS || (isDev ? '*' : ''),
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

export function success<T>(data: T, requestId: string, statusCode = 200): APIGatewayProxyResultV2 {
  const body: SuccessResponse<T> = {
    success: true,
    data,
    requestId,
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function error(
  code: string,
  message: string,
  requestId: string,
  statusCode = 400,
): APIGatewayProxyResultV2 {
  const body: ErrorResponse = {
    success: false,
    error: { code, message },
    requestId,
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function cors(): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  };
}
