import { AnimatedSection } from '@/components/common/AnimatedSection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Is registration free?',
    a: 'Yes, registration is completely free. You can create a profile, upload photos, and browse basic matches at no cost. Premium features are available through our subscription plans.',
  },
  {
    q: 'Who can create a profile?',
    a: 'Profiles can be created by the individual themselves or by family members (parents, siblings, or relatives) on their behalf. This respects the traditional role of family in the matchmaking process.',
  },
  {
    q: 'How is my privacy protected?',
    a: 'You have full control over your privacy. You can hide your WhatsApp number, date of birth, and set photo visibility to everyone, contacts only, or hidden. We never share your data with third parties.',
  },
  {
    q: 'How does the matching work?',
    a: 'Our matching system considers your partner preferences including age, location, religion, caste, education, and lifestyle to suggest compatible profiles. You get daily recommendations based on mutual compatibility.',
  },
  {
    q: 'Can I use this from outside the UK?',
    a: 'Absolutely. While we are UK-based, our platform serves the global Tamil community. Members from Sri Lanka, India, Canada, Australia, the UAE, and many other countries use our platform.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) through our secure payment partner Stripe. All transactions are encrypted and secure.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes, you can cancel your subscription at any time from your account settings. You will continue to have access to premium features until the end of your billing period.',
  },
  {
    q: 'How do I report a suspicious profile?',
    a: 'You can report any profile by clicking the "Report" button on their profile page. Choose a reason and add details. Our team reviews every report within 24 hours.',
  },
  {
    q: 'What makes this different from other matrimony sites?',
    a: 'We are built specifically for the Tamil community with cultural understanding at our core. Our platform offers a premium, modern experience with strong privacy controls, verified profiles, and smart matching — not a generic database search.',
  },
];

export default function FAQPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="page-container max-w-3xl mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-muted-foreground">Everything you need to know about Matrimony.</p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border bg-white px-6 shadow-soft-sm"
              >
                <AccordionTrigger className="text-left font-heading font-semibold text-sm sm:text-base hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </div>
  );
}
