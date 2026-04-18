import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Loader2,
  Crown,
  Sparkles,
  Shield,
  Zap,
  AlertTriangle,
  Eye,
  Heart,
  MessageCircle,
  Camera,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/toaster';
import { usePlans, useMySubscription, useCreateCheckout, useCancelSubscription } from '../hooks/useSubscription';

interface FeatureRow {
  label: string;
  icon: typeof Check;
  free: string | boolean;
  silver: string | boolean;
  gold: string | boolean;
  platinum: string | boolean;
}

const features: FeatureRow[] = [
  { label: 'Profile views/month', icon: Eye, free: '10', silver: '30', gold: '25', platinum: '30' },
  { label: 'Interests/month', icon: Heart, free: '5', silver: '15', gold: '25', platinum: '30' },
  { label: 'Chat access', icon: MessageCircle, free: false, silver: true, gold: true, platinum: true },
  { label: 'Contact info visible', icon: Users, free: false, silver: false, gold: true, platinum: true },
  { label: 'Who viewed me', icon: Eye, free: false, silver: 'Count only', gold: 'Full details', platinum: 'Full details' },
  { label: 'Photo uploads', icon: Camera, free: '3 max', silver: '6 max', gold: '6 max', platinum: '6 max' },
  { label: "View other's photos", icon: Camera, free: '1 photo', silver: '4 photos', gold: '4 photos', platinum: 'All photos' },
  { label: 'Photo visibility controls', icon: Eye, free: false, silver: true, gold: true, platinum: true },
  { label: 'Profile boost', icon: Zap, free: false, silver: false, gold: '1/month', platinum: '3/month' },
  { label: 'Priority in search', icon: Search, free: false, silver: false, gold: false, platinum: true },
];

interface PlanCardConfig {
  id: string;
  icon: typeof Crown;
  accent: string;
  iconBg: string;
  gradientFrom: string;
  popular: boolean;
}

const planConfigs: Record<string, PlanCardConfig> = {
  silver: { id: 'silver', icon: Shield, accent: 'text-slate-600', iconBg: 'bg-slate-100', gradientFrom: 'from-slate-50', popular: false },
  gold: { id: 'gold', icon: Crown, accent: 'text-accent-600', iconBg: 'bg-accent-100', gradientFrom: 'from-accent-50', popular: true },
  platinum: { id: 'platinum', icon: Zap, accent: 'text-violet-600', iconBg: 'bg-violet-100', gradientFrom: 'from-violet-50', popular: false },
};

const planHighlights: Record<string, string[]> = {
  silver: ['Chat with your matches', '30 views + 15 interests/month', 'See who viewed your profile'],
  gold: ['See contact info (WhatsApp & email)', 'Unlimited views & interests', '1 profile boost per month'],
  platinum: ['Top search placement always', '3 boosts per month', 'Everything in Gold included'],
};

export default function PlansPage() {
  const { data: plansResponse, isLoading } = usePlans();
  const { data: subResponse } = useMySubscription();
  const checkout = useCreateCheckout();
  const cancelSub = useCancelSubscription();
  const toast = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const plans = plansResponse?.success ? plansResponse.data : [];
  const currentPlan = subResponse?.success ? subResponse.data.subscription.planId : 'free';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-56 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 sm:mb-10"
      >
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-primary shadow-glow mb-4">
          <Sparkles className="h-5 w-5 text-accent-400" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          Choose Your Plan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Unlock premium features to find your perfect match faster
        </p>
        {currentPlan !== 'free' && (
          <Badge variant="gold" className="mt-3 text-[10px]">
            <Crown className="mr-1 h-3 w-3" />
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan Active
          </Badge>
        )}
      </motion.div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {plans.map((plan, i) => {
          const config = planConfigs[plan.id] || planConfigs.silver;
          const isCurrentPlan = currentPlan === plan.id;
          const price = (plan.priceMonthly / 100).toFixed(2);
          const Icon = config.icon;
          const highlights = planHighlights[plan.id] || [];

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={cn(
                  'relative rounded-2xl border-0 overflow-hidden transition-all h-full',
                  config.popular
                    ? 'shadow-soft-lg ring-2 ring-accent-300 ring-offset-2 sm:-mt-3 sm:mb-3'
                    : 'shadow-soft hover:shadow-soft-lg',
                )}
              >
                {/* Popular ribbon */}
                {config.popular && (
                  <div className="bg-gradient-gold text-white text-center py-1.5 text-[10px] font-bold tracking-wide uppercase">
                    Most Popular
                  </div>
                )}

                <div className={cn('p-5 sm:p-6 bg-gradient-to-b to-white', config.gradientFrom)}>
                  {/* Icon + Name */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.iconBg)}>
                      <Icon className={cn('h-5 w-5', config.accent)} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg leading-none">{plan.name}</h3>
                      {isCurrentPlan && (
                        <span className="text-[9px] text-accent-600 font-semibold">Current Plan</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <span className="font-heading text-4xl font-bold text-foreground">£{price}</span>
                    <span className="text-sm text-muted-foreground ml-1">/mo</span>
                  </div>

                  {/* CTA */}
                  <Button
                    className={cn(
                      'w-full rounded-xl mb-5 h-11',
                      config.popular && !isCurrentPlan && 'shadow-glow',
                    )}
                    variant={config.popular ? 'default' : 'outline'}
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

                  {/* Highlights */}
                  <ul className="space-y-3">
                    {highlights.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-sm text-foreground leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Compare all features link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-center mb-6"
      >
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="text-sm text-primary-700 hover:text-primary-800 font-medium underline underline-offset-2 transition-colors"
        >
          {showComparison ? 'Hide full comparison' : 'Compare all features'}
        </button>
      </motion.div>

      {/* Full Comparison Table */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8"
        >
          <Card className="border-0 shadow-soft-lg rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-warm-50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs w-[200px]">Feature</th>
                    <th className="text-center py-3 px-3 font-medium text-xs w-[80px]">
                      <span className="text-muted-foreground">Free</span>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-xs w-[80px]">
                      <span className="text-slate-600">Silver</span>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-xs w-[80px]">
                      <span className="text-accent-600 font-semibold">Gold</span>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-xs w-[80px]">
                      <span className="text-violet-600">Platinum</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {features.map((row) => (
                    <tr key={row.label} className="hover:bg-warm-50/50 transition-colors">
                      <td className="py-3 px-4 text-xs text-foreground font-medium">
                        {row.label}
                      </td>
                      {(['free', 'silver', 'gold', 'platinum'] as const).map((plan) => {
                        const val = row[plan];
                        return (
                          <td key={plan} className="text-center py-3 px-3">
                            {val === true ? (
                              <div className="flex justify-center">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                                  <Check className="h-3 w-3 text-emerald-600" />
                                </div>
                              </div>
                            ) : val === false ? (
                              <div className="flex justify-center">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50">
                                  <X className="h-3 w-3 text-red-400" />
                                </div>
                              </div>
                            ) : (
                              <span className={cn(
                                'text-xs font-medium',
                                plan === 'gold' ? 'text-accent-700' :
                                plan === 'platinum' ? 'text-violet-700' :
                                'text-foreground',
                              )}>
                                {val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price row — uses same table structure for alignment */}
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-warm-50/50 border-t">
                  <td className="py-3 px-4 text-xs font-semibold text-foreground w-[200px]">Monthly price</td>
                  <td className="text-center py-3 px-3 text-xs font-bold text-foreground w-[80px]">Free</td>
                  <td className="text-center py-3 px-3 text-xs font-bold text-foreground w-[80px]">£9.99</td>
                  <td className="text-center py-3 px-3 text-xs font-bold text-accent-700 w-[80px]">£19.99</td>
                  <td className="text-center py-3 px-3 text-xs font-bold text-violet-700 w-[80px]">£29.99</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </motion.div>
      )}

      {/* Cancel Plan */}
      {currentPlan !== 'free' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-center pb-4"
      >
        <p className="text-[11px] text-muted-foreground">
          All plans auto-renew monthly. Cancel anytime. Payments processed securely by Stripe.
        </p>
      </motion.div>

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
              {currentPlan === 'platinum' && <li>- Priority search placement</li>}
              {currentPlan === 'platinum' && <li>- 3 profile boosts per month</li>}
              {(currentPlan === 'gold' || currentPlan === 'platinum') && <li>- Contact info visibility (WhatsApp & email)</li>}
              {(currentPlan === 'gold' || currentPlan === 'platinum') && <li>- Unlimited profile views & interests</li>}
              {(currentPlan === 'gold' || currentPlan === 'platinum') && <li>- Profile boost feature</li>}
              <li>- Chat access</li>
              <li>- Who viewed me feature</li>
              <li>- Photo visibility controls</li>
              <li>- Reverts to 3 photo uploads (may hide extra photos)</li>
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
