import Stripe from 'stripe';
import { SubscriptionRepository } from '../repositories/subscription-repository.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
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
  private coreRepo: BaseRepository;

  constructor() {
    this.repo = new SubscriptionRepository();
    this.coreRepo = new BaseRepository('core');
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

    // Prevent duplicate subscriptions
    const existingSub = await this.repo.getSubscription(userId);
    if (existingSub && existingSub.status === 'active' && existingSub.planId !== 'free') {
      throw new ValidationError(`You already have an active ${existingSub.planId} subscription. Cancel it first to switch plans.`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `The World Tamil Matrimony ${plan.name} Plan`,
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

    if (!webhookSecret) {
      throw new ValidationError('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const event: Stripe.Event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);

    const eventKey = `STRIPE_EVENT#${event.id}`;
    const alreadyProcessed = await this.coreRepo.get(eventKey, 'PROCESSED');
    if (alreadyProcessed) {
      logger.info('Duplicate webhook ignored', { eventId: event.id });
      return;
    }
    await this.coreRepo.put({
      PK: eventKey,
      SK: 'PROCESSED',
      eventType: event.type,
      processedAt: nowISO(),
      // 90-day TTL — Stripe can retry failed webhooks for up to ~3 weeks,
      // and we want a generous buffer beyond that to dedupe retries that
      // arrive after a long gap.
      ttl: Math.floor(Date.now() / 1000) + 86400 * 90,
    });

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
          currentPeriodStart: now,
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
        const stripeSubId = invoice.subscription as string;

        if (stripeSubId) {
          const userId = await this.repo.findUserByStripeSubscriptionId(stripeSubId);
          if (userId) {
            const renewalNow = nowISO();
            const newEnd = new Date();
            newEnd.setMonth(newEnd.getMonth() + 1);
            await this.repo.updateSubscription(userId, {
              endDate: newEnd.toISOString(),
              currentPeriodStart: renewalNow,
              status: 'active',
              // Recovery case: a successful charge after a previous
              // failure clears the failing-payment flag.
              paymentFailing: false,
            });
            logger.info('Subscription renewed', {
              userId,
              newEndDate: newEnd.toISOString(),
              periodStart: renewalNow,
            });
          } else {
            logger.warn('Invoice paid but no matching subscription found', { stripeSubId });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = invoice.subscription as string;
        if (!stripeSubId) break;

        const userId = await this.repo.findUserByStripeSubscriptionId(stripeSubId);
        if (!userId) {
          logger.warn('Payment failed but no matching subscription found', { stripeSubId });
          break;
        }

        // Mark the subscription so the next sync — or any retry-success
        // (`invoice.paid`) — can reason about the failing state.
        // Stripe's built-in dunning emails handle notifying the user.
        await this.repo.updateSubscription(userId, { paymentFailing: true });
        logger.info('Payment failing flag set', { userId, stripeSubId });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await this.repo.findUserByStripeSubscriptionId(subscription.id);
        if (userId) {
          await this.repo.updateSubscription(userId, { status: 'cancelled' });
          await this.repo.deleteStripeSubscriptionIndex(subscription.id);
          logger.info('Subscription cancelled via Stripe', { userId, stripeSubId: subscription.id });
        } else {
          logger.warn('Subscription deleted but no matching record found', { stripeSubId: subscription.id });
        }
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

  /**
   * Generate a one-time URL into Stripe's hosted Customer Portal so the
   * user can update their payment method without typing card details
   * into our app (we never see them — Stripe owns the page).
   *
   * Requires the Customer Portal to be enabled in Stripe Dashboard
   * (Settings → Billing → Customer portal). Without that, the API
   * returns a 400 and we surface a generic support fallback.
   */
  async createBillingPortalUrl(stripeCustomerId: string): Promise<string> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${frontendUrl}/dashboard`,
    });
    return session.url;
  }

  async cancelSubscription(userId: string): Promise<{ status: string }> {
    const sub = await this.repo.getSubscription(userId);
    if (!sub || sub.status !== 'active' || sub.planId === 'free') {
      throw new ValidationError('No active subscription to cancel');
    }

    // Cancel in Stripe first (stops future charges)
    if (sub.stripeSubscriptionId && !sub.stripeSubscriptionId.startsWith('sub_test_')) {
      try {
        await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
        logger.info('Stripe subscription cancelled', { stripeSubId: sub.stripeSubscriptionId });
      } catch (err) {
        logger.error('Failed to cancel Stripe subscription', { error: String(err), stripeSubId: sub.stripeSubscriptionId });
        throw new ValidationError('Failed to cancel subscription with payment provider. Please try again or contact support.');
      }
    }

    // Only update DB if Stripe succeeded (or was test/seeded)
    await this.repo.updateSubscription(userId, { status: 'cancelled' });
    if (sub.stripeSubscriptionId) {
      await this.repo.deleteStripeSubscriptionIndex(sub.stripeSubscriptionId);
    }
    logger.info('Subscription cancelled', { userId, planId: sub.planId });

    return { status: 'subscription_cancelled' };
  }
}

