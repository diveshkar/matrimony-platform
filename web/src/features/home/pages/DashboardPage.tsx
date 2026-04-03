import { Link } from 'react-router-dom';
import { Search, Heart, MessageCircle, User, Star, Crown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/lib/auth/auth-context';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { formatDate } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';

const quickActions = [
  { label: 'Discover Matches', href: ROUTES.DISCOVER, icon: Search, desc: 'Browse and search profiles' },
  { label: 'My Interests', href: ROUTES.INTERESTS, icon: Heart, desc: 'Sent and received interests' },
  { label: 'Messages', href: ROUTES.CHATS, icon: MessageCircle, desc: 'Chat with your matches' },
  { label: 'My Profile', href: ROUTES.MY_PROFILE, icon: User, desc: 'View and edit your profile' },
  { label: 'Shortlist', href: ROUTES.SHORTLIST, icon: Star, desc: 'Your saved profiles' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: subResponse } = useMySubscription();

  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const planStatus = subResponse?.success ? subResponse.data.subscription.status : 'active';
  const endDate = subResponse?.success ? subResponse.data.subscription.endDate : undefined;
  const isPremium = planId !== 'free' && planStatus === 'active';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.phone ? '' : ''}`}
        description="Find your perfect match today"
        action={
          isPremium ? (
            <Badge variant="gold" className="px-3 py-1.5 text-sm">
              <Crown className="mr-1.5 h-4 w-4" />
              {planLabel} Member
            </Badge>
          ) : undefined
        }
      />

      {/* Current Plan Card */}
      <Card className={isPremium
        ? 'border-2 border-accent-400 bg-gradient-to-r from-accent-50 to-warm-100 shadow-gold-glow'
        : 'border-0 shadow-soft bg-gradient-to-r from-primary-50 to-warm-100'
      }>
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isPremium ? 'bg-accent-100' : 'bg-primary-100'}`}>
                <Crown className={`h-6 w-6 ${isPremium ? 'text-accent-600' : 'text-primary-600'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-lg">{planLabel} Plan</h3>
                  {isPremium && <Badge variant="success" className="text-[10px]">Active</Badge>}
                </div>
                {isPremium && endDate ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    Renews {formatDate(endDate, 'DD MMM YYYY')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upgrade to unlock premium features
                  </p>
                )}
              </div>
            </div>
            <Button variant={isPremium ? 'outline' : 'default'} size="sm" asChild>
              <Link to={ROUTES.PLANS}>
                {isPremium ? 'Manage Plan' : 'Upgrade'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Card className="h-full hover-lift border-0 shadow-soft cursor-pointer group">
              <CardContent className="pt-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
                  <action.icon className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm">{action.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Profile completion nudge */}
      <Card className="border-0 shadow-soft">
        <CardContent className="pt-6 text-center">
          <h3 className="font-heading font-semibold text-lg">Complete Your Profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A complete profile gets 5x more interest. Add photos and fill in all details.
          </p>
          <Button className="mt-4" size="sm" asChild>
            <Link to={ROUTES.MY_PROFILE}>View Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
