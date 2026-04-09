import { useState } from 'react';
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
  Heart,
  Trash2,
  PauseCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
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
      {
        label: 'Partner Preferences',
        href: ROUTES.EDIT_PREFERENCES,
        icon: Heart,
        desc: 'Update matching criteria',
      },
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
      {
        label: 'Share Your Story',
        href: ROUTES.SHARE_STORY,
        icon: Heart,
        desc: 'Share your success story',
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
  const toast = useToast();
  const { data: subResponse } = useMySubscription();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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

      {/* Account */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Account
        </p>
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardContent className="p-0 divide-y">
            <button
              onClick={() => logout.mutate()}
              className="flex w-full items-center gap-4 p-4 hover:bg-warm-50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                <LogOut className="h-4 w-4 text-primary-700" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-sm font-medium">Log Out</h3>
                <p className="text-[11px] text-muted-foreground">Sign out of your account</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
            <button
              onClick={() => setDeactivateOpen(true)}
              className="flex w-full items-center gap-4 p-4 hover:bg-warm-50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <PauseCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-sm font-medium text-amber-700">Deactivate Profile</h3>
                <p className="text-[11px] text-muted-foreground">Hide your profile temporarily</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex w-full items-center gap-4 p-4 hover:bg-destructive/5 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-sm font-medium text-destructive">Delete Account</h3>
                <p className="text-[11px] text-muted-foreground">Permanently remove your account</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
              <PauseCircle className="h-7 w-7 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Deactivate Profile?</DialogTitle>
            <DialogDescription className="text-center">
              Your profile will be hidden from all search results and discovery. No one will be able to find or view your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50/50 rounded-xl p-4 text-sm text-amber-800 space-y-2">
            <p className="font-medium">What happens when you deactivate:</p>
            <ul className="space-y-1 text-xs text-amber-700">
              <li>- Your profile is hidden from search results</li>
              <li>- Existing conversations remain intact</li>
              <li>- Your subscription stays active</li>
              <li>- You can reactivate anytime by logging back in</li>
            </ul>
          </div>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeactivateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                setDeactivateOpen(false);
                toast.info('Profile deactivated', 'Your profile is now hidden from search results');
              }}
            >
              <PauseCircle className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center text-destructive">Delete Account?</DialogTitle>
            <DialogDescription className="text-center">
              This action is permanent and cannot be undone. All your data will be lost forever.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/5 rounded-xl p-4 text-sm text-destructive space-y-2">
            <p className="font-medium">You will permanently lose:</p>
            <ul className="space-y-1 text-xs">
              <li>- Your profile and all photos</li>
              <li>- All matches, interests, and shortlist</li>
              <li>- All conversations and messages</li>
              <li>- Your subscription (no refund)</li>
            </ul>
          </div>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeleteOpen(false)}
            >
              Keep Account
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => {
                setDeleteOpen(false);
                toast.error('Account deletion', 'Please contact support@matrimony.com to delete your account');
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
