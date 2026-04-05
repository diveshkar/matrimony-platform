import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Crown, Sparkles, Shield, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/toaster';
import { usePlans, useMySubscription, useCreateCheckout, useCancelSubscription } from '../hooks/useSubscription';

interface PlanStyle {
  popular: boolean;
  icon: typeof Crown;
  accent: string;
  iconBg: string;
  ring: string;
  features: string[];
}

const planStyles: Record<string, PlanStyle> = {
  silver: {
    popular: false,
    icon: Shield,
    accent: 'text-slate-600',
    iconBg: 'bg-slate-100',
    ring: '',
    features: [
      '30 profile views/day',
      '15 interests/day',
      'Chat access',
      'Who viewed me',
    ],
  },
  gold: {
    popular: true,
    icon: Crown,
    accent: 'text-accent-600',
    iconBg: 'bg-accent-100',
    ring: 'ring-2 ring-accent-300 ring-offset-2',
    features: [
      'Unlimited profile views',
      'Unlimited interests',
      'Full chat access',
      'View contact info',
      '1 profile boost/month',
    ],
  },
  platinum: {
    popular: false,
    icon: Zap,
    accent: 'text-violet-600',
    iconBg: 'bg-violet-100',
    ring: '',
    features: [
      'Everything in Gold',
      'Priority support',
      '3 boosts/month',
      'Premium badge',
      'Top search placement',
    ],
  },
};

export default function PlansPage() {
  const { data: plansResponse, isLoading } = usePlans();
  const { data: subResponse } = useMySubscription();
  const checkout = useCreateCheckout();
  const cancelSub = useCancelSubscription();
  const toast = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const plans = plansResponse?.success ? plansResponse.data : [];
  const currentPlan = subResponse?.success ? subResponse.data.subscription.planId : 'free';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-56 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 sm:mb-10"
      >
        <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary-50 mb-3">
          <Sparkles className="h-5 w-5 text-primary-700" />
        </div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
          Choose Your Plan
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          Unlock premium features to find your perfect match faster
        </p>
        {currentPlan !== 'free' && (
          <Badge variant="gold" className="mt-3 text-[10px]">
            <Crown className="mr-1 h-3 w-3" />
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan Active
          </Badge>
        )}
      </motion.div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {plans.map((plan, i) => {
          const style = planStyles[plan.id] || planStyles.silver;
          const isCurrentPlan = currentPlan === plan.id;
          const price = (plan.priceMonthly / 100).toFixed(2);
          const Icon = style.icon;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'relative rounded-2xl bg-white overflow-hidden transition-all',
                style.popular
                  ? 'shadow-soft-lg sm:-mt-2 sm:mb-2'
                  : 'shadow-soft hover:shadow-soft-lg',
                style.ring,
              )}
            >
              {/* Popular ribbon */}
              {style.popular && (
                <div className="bg-gradient-gold text-white text-center py-1.5 text-[10px] font-bold tracking-wide uppercase">
                  Most Popular
                </div>
              )}

              <div className="p-5 sm:p-6">
                {/* Icon + Name */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', style.iconBg)}>
                    <Icon className={cn('h-4.5 w-4.5', style.accent)} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base leading-none">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="text-[9px] text-accent-600 font-semibold">Current</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className="font-heading text-3xl font-bold text-foreground">£{price}</span>
                  <span className="text-xs text-muted-foreground ml-1">/mo</span>
                </div>

                {/* CTA */}
                <Button
                  className={cn(
                    'w-full rounded-xl mb-5',
                    style.popular && !isCurrentPlan && 'shadow-glow',
                  )}
                  variant={style.popular ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    checkout.mutate(plan.id);
                  }}
                  disabled={isCurrentPlan || checkout.isPending}
                >
                  {checkout.isPending && selectedPlanId === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    `Get ${plan.name}`
                  )}
                </Button>

                {/* Features */}
                <ul className="space-y-2.5">
                  {style.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                      </div>
                      <span className="text-xs text-muted-foreground leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cancel Plan */}
      {currentPlan !== 'free' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center mb-4"
        >
          <button
            onClick={() => setCancelOpen(true)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
          >
            Cancel my subscription and switch to Free
          </button>
        </motion.div>
      )}

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-[11px] text-muted-foreground pb-6"
      >
        All plans auto-renew monthly. Cancel anytime.
        Payments processed securely by Stripe.
      </motion.p>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
              <AlertTriangle className="h-7 w-7 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Cancel Subscription?</DialogTitle>
            <DialogDescription className="text-center">
              You'll lose access to your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan features immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50/50 rounded-xl p-4 text-sm space-y-2">
            <p className="font-medium text-amber-800">You'll lose access to:</p>
            <ul className="space-y-1 text-xs text-amber-700">
              {currentPlan === 'platinum' && <li>- 3 profile boosts per month</li>}
              {currentPlan === 'platinum' && <li>- Premium badge & priority support</li>}
              {(currentPlan === 'gold' || currentPlan === 'platinum') && <li>- Contact info visibility</li>}
              {(currentPlan === 'gold' || currentPlan === 'platinum') && <li>- Unlimited profile views & interests</li>}
              <li>- Chat access (Silver+)</li>
              <li>- Who viewed me (Silver+)</li>
            </ul>
          </div>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setCancelOpen(false)}
            >
              Keep Plan
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              disabled={cancelSub.isPending}
              onClick={async () => {
                try {
                  await cancelSub.mutateAsync();
                  setCancelOpen(false);
                  toast.info('Subscription cancelled', 'You are now on the Free plan');
                } catch {
                  toast.error('Failed to cancel', 'Please try again');
                }
              }}
            >
              {cancelSub.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
