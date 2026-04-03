import { AnimatedSection } from '@/components/common/AnimatedSection';

export default function TermsPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="page-container max-w-3xl mx-auto">
        <AnimatedSection>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground text-center">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-muted-foreground text-center">Last updated: April 2026</p>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mt-12 prose prose-neutral max-w-none">
          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using Matrimony, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">2. Eligibility</h2>
              <p>You must be at least 18 years old to use this platform. By creating an account, you confirm that you are seeking a matrimonial match for yourself or an eligible family member.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">3. Account Responsibilities</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, truthful information in your profile. Misrepresentation may result in account suspension.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">4. Acceptable Use</h2>
              <p>You agree not to use the platform for any unlawful purpose, harassment, spam, or to post misleading content. We reserve the right to remove content or suspend accounts that violate these terms.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">5. Subscriptions & Payments</h2>
              <p>Premium features require a paid subscription. Subscriptions auto-renew unless cancelled. You may cancel at any time through your account settings. Refunds are handled in accordance with applicable UK consumer protection laws.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">6. Intellectual Property</h2>
              <p>All content, design, and technology on this platform is owned by Matrimony. You may not copy, reproduce, or distribute any part of the service without written permission.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
              <p>We provide this service on an &quot;as is&quot; basis. While we strive for a safe and reliable platform, we cannot guarantee the accuracy of user-provided information or the outcome of any interaction.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">8. Changes to Terms</h2>
              <p>We may update these terms from time to time. We will notify registered users of significant changes via email. Continued use of the platform constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">9. Contact</h2>
              <p>For questions about these terms, contact us at support@matrimony.com.</p>
            </section>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
