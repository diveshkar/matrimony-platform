import { AnimatedSection } from '@/components/common/AnimatedSection';
import { SEO } from '@/components/common/SEO';

export default function RefundPolicyPage() {
  return (
    <div className="py-16 sm:py-20">
      <SEO
        title="Refund Policy"
        description="Refund Policy for The World Tamil Matrimony."
        path="/refund-policy"
      />
      <div className="page-container max-w-3xl mx-auto">
        <AnimatedSection>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground text-center">
            Refund Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground text-center">Last updated: April 2026</p>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mt-12 prose prose-neutral max-w-none">
          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                1. Subscription model
              </h2>
              <p>
                The World Tamil Matrimony offers monthly and annual subscription plans (Gold and
                Platinum). Subscriptions are billed in advance and auto-renew at the end of each
                billing cycle unless cancelled before the renewal date.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                2. Cancellation policy
              </h2>
              <p>
                You may cancel your subscription at any time through your account settings. Upon
                cancellation, your plan will remain active until the end of the current billing
                period. No further charges will be made after cancellation.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                3. Refund eligibility
              </h2>
              <p>
                We offer a 7-day refund window from the date of first purchase for new subscribers
                who have not made use of premium features. Refunds may be requested if:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You were charged in error or experienced a technical fault</li>
                <li>You are a new subscriber and have not accessed premium features</li>
                <li>Your subscription renewed without prior notice due to a platform error</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                4. Non-refundable situations
              </h2>
              <p>Refunds will not be issued in the following circumstances:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Subscription has been active for more than 7 days</li>
                <li>Premium features have been accessed or used during the billing period</li>
                <li>Account was suspended due to a Terms of Service violation</li>
                <li>Change of mind after the 7-day window has passed</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                5. How to request a refund
              </h2>
              <p>
                To request a refund, email us at support@theworldtamilmatrimony.com with your
                registered email address and reason for the request. We aim to respond within 3
                business days. Approved refunds are processed within 5–10 business days to your
                original payment method.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                6. UK consumer rights
              </h2>
              <p>
                As a UK-operated service, we comply with the Consumer Rights Act 2015 and the
                Consumer Contracts Regulations 2013. If you believe you are entitled to a refund
                under UK consumer law beyond this policy, please contact us directly.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                7. Contact
              </h2>
              <p>
                For refund enquiries, contact us at support@theworldtamilmatrimony.com. For billing
                disputes, you may also contact Stripe directly as our payment processor.
              </p>
            </section>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
