import { AnimatedSection } from '@/components/common/AnimatedSection';

export default function PrivacyPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="page-container max-w-3xl mx-auto">
        <AnimatedSection>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground text-center">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground text-center">Last updated: April 2026</p>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mt-12 prose prose-neutral max-w-none">
          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide when creating your profile, including your name,
                contact details, photos, cultural background, and partner preferences. We also
                collect usage data to improve the platform.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                2. How We Use Your Information
              </h2>
              <p>
                Your information is used to provide matchmaking services, display your profile to
                potential matches, send notifications, process payments, and improve our platform.
                We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                3. Your Privacy Controls
              </h2>
              <p>
                You have full control over your profile visibility. You can hide your WhatsApp number,
                date of birth, and control who sees your photos. You can also choose to hide your
                profile from search results entirely.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                4. Data Storage & Security
              </h2>
              <p>
                Your data is stored securely on AWS infrastructure with encryption at rest and in
                transit. We follow industry best practices to protect your information from
                unauthorised access.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                5. Data Sharing
              </h2>
              <p>
                We share your data only with: other registered users (based on your privacy
                settings), payment processors for transactions, and service providers who help us
                operate the platform under strict confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                6. Your Rights (UK GDPR)
              </h2>
              <p>
                As a UK-based service, we comply with the UK General Data Protection Regulation. You
                have the right to access, correct, delete, or export your personal data. You may
                also withdraw consent at any time.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">7. Cookies</h2>
              <p>
                We use essential cookies for authentication and session management. We do not use
                third-party tracking cookies. Analytics data is collected anonymously to improve the
                user experience.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                8. Data Retention
              </h2>
              <p>
                We retain your data for as long as your account is active. If you delete your
                account, your personal data will be permanently removed within 30 days, except where
                retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">9. Contact</h2>
              <p>
                For privacy-related enquiries or to exercise your data rights, contact our Data
                Protection Officer at privacy@matrimony.com.
              </p>
            </section>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
