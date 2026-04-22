import { Heart, Globe, Shield, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/common/AnimatedSection';
import { SEO } from '@/components/common/SEO';

const values = [
  {
    icon: Heart,
    title: 'Tradition with Care',
    desc: 'We honour the cultural values that matter to Tamil families while building a modern platform.',
  },
  {
    icon: Shield,
    title: 'Trust & Privacy',
    desc: 'Your safety is our foundation. Every feature is built with your privacy in mind.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    desc: 'Connecting Tamil hearts across the UK, Sri Lanka, India, Canada, Australia, and beyond.',
  },
  {
    icon: Users,
    title: 'Community First',
    desc: 'Built by people who understand the Tamil community and the importance of family in finding a life partner.',
  },
];

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-20">
      <SEO
        title="About The World Tamil Matrimony"
        description="Learn about The World Tamil Matrimony — the trusted UK-based platform for the global Tamil community. Verified profiles, smart matching, and family-first values for Tamil singles in the UK, Sri Lanka, India, Canada, Australia, and worldwide."
        keywords="about Tamil matrimony, premium Tamil matrimony platform, UK Tamil matrimony, Tamil diaspora matrimony, trusted Tamil matrimony, family-first Tamil matrimony"
        path="/about"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About The World Tamil Matrimony',
          url: 'https://theworldtamilmatrimony.com/about',
          mainEntity: {
            '@type': 'Organization',
            name: 'The World Tamil Matrimony',
            description:
              'Premium Tamil matrimony platform connecting Tamil hearts worldwide',
            foundingDate: '2026',
            areaServed: ['United Kingdom', 'Sri Lanka', 'India', 'Canada', 'Australia'],
          },
        }}
      />
      <div className="page-container">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            About The World Tamil Matrimony
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            We are a UK-based matrimony platform built exclusively for the global Tamil community.
            Our mission is simple: help Tamil families find meaningful, lasting connections rooted
            in shared values, culture, and tradition.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Whether you are in London, Colombo, Toronto, or Sydney — we bring Tamil hearts together
            with trust, technology, and the warmth that our community deserves.
          </p>
        </AnimatedSection>

        <AnimatedSection className="mb-16">
          <div className="rounded-2xl bg-gradient-primary text-white p-10 sm:p-14 text-center">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">Our Mission</h2>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              To be the most trusted, premium matrimony platform for Tamil families worldwide —
              where every match is made with care, respect, and understanding.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Our Values
          </h2>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <Card className="h-full border-0 shadow-soft">
                <CardContent className="pt-6 flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <v.icon className="h-6 w-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">{v.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}
