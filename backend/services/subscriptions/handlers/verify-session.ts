import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { SubscriptionRepository } from '../repositories/subscription-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import { logger } from '../../shared/utils/logger.js';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

const repo = new SubscriptionRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = event.body ? JSON.parse(event.body) : {};
  if (!body.sessionId) throw new ValidationError('sessionId is required');

  const session = await getStripe().checkout.sessions.retrieve(body.sessionId);

  if (session.payment_status !== 'paid') {
    throw new ValidationError('Payment not completed');
  }

  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || userId !== authedEvent.auth.userId) {
    throw new ValidationError('Session does not belong to this user');
  }

  const existing = await repo.getSubscription(userId);
  if (existing?.stripeSubscriptionId === session.subscription) {
    logger.info('Subscription already activated', { userId, planId });
    return success({ status: 'already_active', planId }, requestId);
  }

  const now = nowISO();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  await repo.saveSubscription({
    userId,
    planId: planId as 'silver' | 'gold' | 'platinum',
    stripeSubscriptionId: session.subscription as string,
    stripeCustomerId: session.customer as string,
    startDate: now,
    endDate: endDate.toISOString(),
    status: 'active',
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  });

  logger.info('Subscription activated via session verify', { userId, planId });

  return success({ status: 'activated', planId }, requestId);
}

export const main = createHandler(withAuth(handler));
