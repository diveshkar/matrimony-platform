import { Link } from 'react-router-dom';
import {
  Shield,
  UserX,
  Eye,
  Bell,
  Crown,
  LogOut,
  ChevronRight,
  User,
  Camera,
  Edit,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLogout } from '@/features/auth/hooks/useAuthMutation';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

const sections = [
  {
    title: 'Profile',
    items: [
      { label: 'My Profile', href: ROUTES.MY_PROFILE, icon: User, desc: 'View your profile' },
      {
        label: 'Edit Profile',
        href: ROUTES.EDIT_PROFILE,
        icon: Edit,
        desc: 'Update your information',
      },
      { label: 'My Photos', href: ROUTES.MY_PHOTOS, icon: Camera, desc: 'Manage your photos' },
    ],
  },
  {
    title: 'Activity',
    items: [
      {
        label: 'Who Viewed Me',
        href: ROUTES.WHO_VIEWED,
        icon: Eye,
        desc: 'See who viewed your profile',
      },
      {
        label: 'Notifications',
        href: ROUTES.NOTIFICATIONS,
        icon: Bell,
        desc: 'Your notifications',
      },
    ],
  },
  {
    title: 'Privacy & Safety',
    items: [
      {
        label: 'Privacy Settings',
        href: ROUTES.PRIVACY_SETTINGS,
        icon: Shield,
        desc: 'Control visibility',
      },
      {
        label: 'Blocked Users',
        href: ROUTES.BLOCKED_USERS,
        icon: UserX,
        desc: 'Manage blocked profiles',
      },
    ],
  },
];

export default function SettingsPage() {
  const logout = useLogout();
  const { data: subResponse } = useMySubscription();
  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const isPremium = planId !== 'free';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Settings</h1>

      {/* Plan card */}
      <Card
        className={cn(
          'border-0 overflow-hidden',
          isPremium ? 'shadow-gold-glow' : 'shadow-soft',
        )}
      >
        <CardContent className="p-0">
          <Link
            to={ROUTES.PLANS}
            className="flex items-center justify-between p-5 hover:bg-warm-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl',
                  isPremium ? 'bg-accent-100' : 'bg-primary-50',
                )}
              >
                <Crown
                  className={cn('h-6 w-6', isPremium ? 'text-accent-600' : 'text-primary-600')}
                />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm">{planLabel} Plan</p>
                <Badge
                  variant={isPremium ? 'gold' : 'outline'}
                  className="mt-0.5 text-[9px]"
                >
                  {isPremium ? 'Active' : 'Free'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary-700 font-medium">
                {isPremium ? 'Manage' : 'Upgrade'}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {section.title}
          </p>
          <Card className="border-0 shadow-soft overflow-hidden">
            <CardContent className="p-0 divide-y">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-4 p-4 hover:bg-warm-50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <item.icon className="h-4 w-4 text-primary-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium">{item.label}</h3>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Logout */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <button
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-4 p-4 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
