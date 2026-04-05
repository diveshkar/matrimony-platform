import Stripe from 'stripe';
import { SubscriptionRepository } from '../repositories/subscription-repository.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { nowISO } from '../../shared/utils/date.js';
import { logger } from '../../shared/utils/logger.js';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

interface PlanConfig {
  name: string;
  stripePriceId?: string;
  monthlyPriceGBP: number;
}

const PLANS: Record<string, PlanConfig> = {
  silver: { name: 'Silver', monthlyPriceGBP: 999 },
  gold: { name: 'Gold', monthlyPriceGBP: 1999 },
  platinum: { name: 'Platinum', monthlyPriceGBP: 2999 },
};

export class SubscriptionService {
  private repo: SubscriptionRepository;

  constructor() {
    this.repo = new SubscriptionRepository();
  }

  async getPlans(): Promise<unknown[]> {
    const plans = [];
    for (const [id, config] of Object.entries(PLANS)) {
      const entitlement = await this.repo.getEntitlement(id);
      plans.push({
        id,
        name: config.name,
        priceMonthly: config.monthlyPriceGBP,
        currency: 'gbp',
        entitlements: entitlement,
      });
    }
    return plans;
  }

  async createCheckout(
    userId: string,
    planId: string,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const plan = PLANS[planId];
    if (!plan) throw new ValidationError('Invalid plan ID');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Matrimony ${plan.name} Plan`,
              description: `Monthly subscription to ${plan.name} plan`,
            },
            unit_amount: plan.monthlyPriceGBP,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel`,
    });

    if (!session.url) throw new ValidationError('Failed to create checkout session');

    logger.info('Stripe checkout created', { userId, planId, sessionId: session.id });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    const isDevEnv = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
    if (webhookSecret) {
      event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
    } else if (isDevEnv) {
      event = JSON.parse(payload) as Stripe.Event;
      logger.warn('Webhook signature verification skipped (dev mode)');
    } else {
      throw new ValidationError('STRIPE_WEBHOOK_SECRET is required in stage/prod');
    }

    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          logger.warn('Webhook missing metadata', { sessionId: session.id });
          return;
        }

        const now = nowISO();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await this.repo.saveSubscription({
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

        logger.info('Subscription activated', { userId, planId });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;

        logger.info('Invoice paid', { subscriptionId: subId });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info('Subscription cancelled', { subscriptionId: subscription.id });
        break;
      }

      default:
        logger.info('Unhandled webhook event', { type: event.type });
    }
  }

  async getMySubscription(userId: string): Promise<{
    subscription: unknown;
    entitlements: unknown;
  }> {
    const sub = await this.repo.getSubscription(userId);
    const entitlements = await this.repo.getUserEntitlement(userId);

    return {
      subscription: sub || { planId: 'free', status: 'active' },
      entitlements,
    };
  }
}
