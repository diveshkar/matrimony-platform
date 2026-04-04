import { Link } from 'react-router-dom';
import { Shield, UserX, Eye, Bell, Crown, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { useLogout } from '@/features/auth/hooks/useAuthMutation';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { ROUTES } from '@/lib/constants/routes';

const settingsLinks = [
  {
    label: 'Privacy Settings',
    href: ROUTES.PRIVACY_SETTINGS,
    icon: Shield,
    desc: 'Control who sees your info',
  },
  {
    label: 'Blocked Users',
    href: ROUTES.BLOCKED_USERS,
    icon: UserX,
    desc: 'Manage blocked profiles',
  },
  {
    label: 'Who Viewed Me',
    href: ROUTES.WHO_VIEWED,
    icon: Eye,
    desc: 'See who viewed your profile',
  },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell, desc: 'Your notifications' },
  { label: 'Subscription', href: ROUTES.PLANS, icon: Crown, desc: 'Manage your plan' },
];

export default function SettingsPage() {
  const logout = useLogout();
  const { data: subResponse } = useMySubscription();
  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Manage your account" />

      {/* Current plan */}
      <Card className="border-0 shadow-soft">
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50">
              <Crown className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Current Plan</p>
              <Badge variant={planId === 'free' ? 'outline' : 'gold'} className="mt-0.5">
                {planLabel}
              </Badge>
            </div>
          </div>
          <Link to={ROUTES.PLANS} className="text-sm text-primary-700 hover:underline font-medium">
            {planId === 'free' ? 'Upgrade' : 'Manage'}
          </Link>
        </CardContent>
      </Card>

      {/* Settings links */}
      <div className="space-y-2">
        {settingsLinks.map((link) => (
          <Link key={link.href} to={link.href}>
            <Card className="border-0 shadow-soft-sm hover:shadow-soft transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <link.icon className="h-5 w-5 text-primary-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{link.label}</h3>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={() => logout.mutate()}
        className="flex w-full items-center gap-4 p-4 rounded-xl text-destructive hover:bg-destructive/5 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
          <LogOut className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">Log Out</span>
      </button>
    </div>
  );
}
