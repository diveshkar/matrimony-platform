import { Shield, Eye, AlertTriangle, Phone, Lock, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/common/AnimatedSection';

const tips = [
  {
    icon: Lock,
    title: 'Protect Your Identity',
    desc: 'Never share your password, financial details, or personal documents with anyone on the platform.',
  },
  {
    icon: Eye,
    title: 'Verify Before You Trust',
    desc: 'Take your time getting to know someone. Ask questions, meet their family, and do your own checks.',
  },
  {
    icon: Phone,
    title: 'Meet in Safe Places',
    desc: 'Always meet in public places for the first time. Inform a friend or family member about your plans.',
  },
  {
    icon: AlertTriangle,
    title: 'Watch for Red Flags',
    desc: 'Be cautious of people who refuse video calls, ask for money, or pressure you to move fast.',
  },
  {
    icon: UserX,
    title: 'Block & Report',
    desc: 'If someone makes you uncomfortable, block them immediately and report the profile to our team.',
  },
  {
    icon: Shield,
    title: 'We Are Here to Help',
    desc: 'Our support team reviews every report. Contact us anytime at support@matrimony.com.',
  },
];

export default function SafetyPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="page-container">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50">
            <Shield className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Safety Tips
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Your safety is our top priority. Follow these guidelines to protect yourself while
            finding your life partner.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tips.map((tip) => (
            <StaggerItem key={tip.title}>
              <Card className="h-full border-0 shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 mb-4">
                    <tip.icon className="h-5 w-5 text-primary-700" />
                  </div>
                  <h3 className="font-heading font-semibold">{tip.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tip.desc}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}
