import { useState } from 'react';
import { CheckCircle2, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/common/AnimatedSection';
import { cn } from '@/lib/utils/cn';
import { usePlans, useMySubscription, useCreateCheckout } from '../hooks/useSubscription';

const planMeta: Record<string, { popular: boolean; features: string[] }> = {
  silver: {
    popular: false,
    features: ['30 profile views/day', '15 interests/day', 'Limited chat access', 'Who viewed me'],
  },
  gold: {
    popular: true,
    features: ['Unlimited profile views', 'Unlimited interests', 'Full chat access', 'View contact info', '1 profile boost/month'],
  },
  platinum: {
    popular: false,
    features: ['Everything in Gold', 'Priority support', '3 boosts/month', 'Premium badge', 'Top search placement'],
  },
};

export default function PlansPage() {
  const { data: plansResponse, isLoading: plansLoading } = usePlans();
  const { data: subResponse } = useMySubscription();
  const checkout = useCreateCheckout();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const plans = plansResponse?.success ? plansResponse.data : [];
  const currentPlan = subResponse?.success ? subResponse.data.subscription.planId : 'free';

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatedSection className="text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          Choose Your Plan
        </h1>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          Upgrade to connect with more matches and unlock premium features
        </p>
        {currentPlan !== 'free' && (
          <Badge variant="gold" className="mt-3">
            <Crown className="mr-1 h-3 w-3" />
            Current plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Badge>
        )}
      </AnimatedSection>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const meta = planMeta[plan.id] || { popular: false, features: [] };
          const isCurrentPlan = currentPlan === plan.id;
          const priceDisplay = `£${(plan.priceMonthly / 100).toFixed(2)}`;

          return (
            <StaggerItem key={plan.id}>
              <Card className={cn(
                'h-full relative',
                meta.popular ? 'border-2 border-primary-700 shadow-glow' : 'border-0 shadow-soft',
              )}>
                {meta.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-4 py-1 shadow-glow">Most Popular</Badge>
                  </div>
                )}

                <CardContent className="pt-8 pb-6 flex flex-col items-center">
                  <h3 className="font-heading font-bold text-xl">{plan.name}</h3>

                  <div className="mt-4">
                    <span className="font-heading text-4xl font-bold text-primary-800">{priceDisplay}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>

                  <Separator className="my-6 w-full" />

                  <ul className="space-y-3 w-full">
                    {meta.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-8"
                    variant={meta.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      checkout.mutate(plan.id);
                    }}
                    disabled={isCurrentPlan || checkout.isPending}
                  >
                    {checkout.isPending && selectedPlanId === plan.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting to payment...</>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <AnimatedSection delay={0.3} className="text-center">
        <p className="text-sm text-muted-foreground">
          All plans auto-renew monthly. Cancel anytime from your account settings.
          Payments processed securely by Stripe.
        </p>
      </AnimatedSection>
    </div>
  );
}
