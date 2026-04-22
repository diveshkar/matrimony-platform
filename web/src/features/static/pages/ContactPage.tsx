import { Mail, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/common/AnimatedSection';
import { CONFIG } from '@/lib/constants/config';
import { SEO } from '@/components/common/SEO';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    detail: CONFIG.SUPPORT_EMAIL,
    desc: 'We respond within 24 hours',
  },
  {
    icon: MapPin,
    title: 'Based In',
    detail: 'United Kingdom',
    desc: 'Serving Tamil families globally',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    detail: 'Mon - Sat, 9am - 6pm GMT',
    desc: 'Excluding public holidays',
  },
];

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20">
      <SEO
        title="Contact The World Tamil Matrimony"
        description="Get in touch with The World Tamil Matrimony team. Reach our support for help with your Tamil matrimony account, profile verification, plans, or finding your Tamil partner."
        keywords="contact Tamil matrimony, Tamil matrimony support, Tamil matrimony help, Tamil matrimony customer service"
        path="/contact"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact The World Tamil Matrimony',
          url: 'https://theworldtamilmatrimony.com/contact',
          mainEntity: {
            '@type': 'Organization',
            name: 'The World Tamil Matrimony',
            email: CONFIG.SUPPORT_EMAIL,
          },
        }}
      />
      <div className="page-container max-w-4xl mx-auto">
        <AnimatedSection className="text-center mb-14">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Contact Us
          </h1>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Have a question or need help? We are here for you.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {contactInfo.map((info) => (
            <StaggerItem key={info.title}>
              <Card className="h-full border-0 shadow-soft text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                    <info.icon className="h-6 w-6 text-primary-700" />
                  </div>
                  <h3 className="font-heading font-semibold">{info.title}</h3>
                  <p className="mt-2 font-medium text-primary-800 text-sm">{info.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{info.desc}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}
