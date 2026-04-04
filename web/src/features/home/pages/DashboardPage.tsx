import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Heart,
  MessageCircle,
  User,
  Star,
  Crown,
  Calendar,
  Eye,
  Camera,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { useMyProfile } from '@/features/profile/hooks/useProfile';
import { formatDate } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';

const quickActions = [
  {
    label: 'Discover',
    href: ROUTES.DISCOVER,
    icon: Search,
    desc: 'Find your match',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    label: 'Interests',
    href: ROUTES.INTERESTS,
    icon: Heart,
    desc: 'Sent & received',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    label: 'Messages',
    href: ROUTES.CHATS,
    icon: MessageCircle,
    desc: 'Your conversations',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Shortlist',
    href: ROUTES.SHORTLIST,
    icon: Star,
    desc: 'Saved profiles',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Who Viewed',
    href: ROUTES.WHO_VIEWED,
    icon: Eye,
    desc: 'Profile visitors',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'My Photos',
    href: ROUTES.MY_PHOTOS,
    icon: Camera,
    desc: 'Manage photos',
    color: 'bg-indigo-50 text-indigo-600',
  },
];

export default function DashboardPage() {
  useAuth(); // ensure authenticated
  const { data: subResponse } = useMySubscription();
  const { data: profileResponse } = useMyProfile();

  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const planStatus = subResponse?.success ? subResponse.data.subscription.status : 'active';
  const endDate = subResponse?.success ? subResponse.data.subscription.endDate : undefined;
  const isPremium = planId !== 'free' && planStatus === 'active';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  const profile = profileResponse?.success ? profileResponse.data.profile : null;
  const profileName = (profile?.name as string) || '';
  const firstName = profileName.split(' ')[0] || '';
  const completion = (profile?.profileCompletion as number) || 0;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white p-6 sm:p-8"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent-400/10 blur-[60px]" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary-400/10 blur-[50px]" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">
              Welcome{firstName ? `, ${firstName}` : ' back'}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Your journey to finding the perfect match continues
            </p>
          </div>

          {isPremium ? (
            <Badge variant="gold" className="px-4 py-2 text-sm self-start">
              <Crown className="mr-1.5 h-4 w-4" />
              {planLabel} Member
            </Badge>
          ) : (
            <Button variant="gold" size="sm" className="self-start gap-2" asChild>
              <Link to={ROUTES.PLANS}>
                <Crown className="h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Plan + Profile completion row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plan card */}
        <Card
          className={
            isPremium
              ? 'border-accent-200 bg-gradient-to-r from-accent-50/50 to-warm-50'
              : 'border-0 shadow-soft'
          }
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${isPremium ? 'bg-accent-100' : 'bg-primary-50'}`}
              >
                <Crown
                  className={`h-5 w-5 ${isPremium ? 'text-accent-600' : 'text-primary-600'}`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-heading font-semibold text-sm">{planLabel} Plan</p>
                  {isPremium && (
                    <Badge variant="success" className="text-[9px]">
                      Active
                    </Badge>
                  )}
                </div>
                {isPremium && endDate ? (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    Renews {formatDate(endDate, 'DD MMM YYYY')}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Upgrade for more features</p>
                )}
              </div>
              <Link
                to={ROUTES.PLANS}
                className="text-xs text-primary-700 hover:underline font-medium"
              >
                {isPremium ? 'Manage' : 'Upgrade'}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile completion */}
        <Card className="border-0 shadow-soft">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-heading font-semibold text-sm">Profile</p>
                  <span className="text-xs font-bold text-primary-800">{completion}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-primary-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-700 to-primary-500 transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
              <Link
                to={ROUTES.MY_PROFILE}
                className="text-xs text-primary-700 hover:underline font-medium"
              >
                View
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions grid */}
      <div>
        <h2 className="font-heading font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={action.href}>
                <Card className="h-full border-0 shadow-soft-sm hover:shadow-soft transition-all cursor-pointer group text-center">
                  <CardContent className="pt-5 pb-4 px-3">
                    <div
                      className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${action.color} transition-transform group-hover:scale-110`}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading font-semibold text-xs">{action.label}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Card */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 p-6 sm:p-8">
              <h3 className="font-heading font-bold text-lg">Start discovering your matches</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Browse profiles, send interests, and connect with Tamil singles worldwide.
              </p>
              <Button className="mt-4 group" asChild>
                <Link to={ROUTES.DISCOVER}>
                  Discover Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <div className="hidden sm:block w-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <Heart className="h-20 w-20 text-primary-200 m-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
