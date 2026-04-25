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
  PauseCircle,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { useLogout } from '@/features/auth/hooks/useAuthMutation';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { profileApi } from '@/features/profile/api/profile-api';
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
  const [deactivating, setDeactivating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const isPremium = planId !== 'free';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await profileApi.deactivateAccount();
      toast.success(
        'Account deactivated',
        'Your profile is now hidden. Log in anytime to reactivate.',
      );
      setDeactivateOpen(false);
      // Log user out — they can log back in to reactivate
      setTimeout(() => logout.mutate(), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Please try again';
      toast.error('Failed to deactivate', msg);
    } finally {
      setDeactivating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await profileApi.deleteAccount();
      toast.success(
        'Account deleted',
        'Your account and data have been permanently removed.',
      );
      setDeleteOpen(false);
      setTimeout(() => logout.mutate(), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Please try again';
      toast.error('Failed to delete account', msg);
    } finally {
      setDeleting(false);
    }
  };

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
                <p className="text-[11px] text-muted-foreground">Hide your profile from search & matches</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
            <button
              onClick={() => {
                setDeleteConfirmText('');
                setDeleteOpen(true);
              }}
              className="flex w-full items-center gap-4 p-4 hover:bg-rose-50/50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                <Trash2 className="h-4 w-4 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-sm font-medium text-rose-700">Delete Account</h3>
                <p className="text-[11px] text-muted-foreground">Permanently remove your account & data</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Deactivate Dialog — soft delete: hides profile, can reactivate by logging back in */}
      <Dialog open={deactivateOpen} onOpenChange={(open) => !deactivating && setDeactivateOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
              <PauseCircle className="h-7 w-7 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Deactivate Profile?</DialogTitle>
            <DialogDescription className="text-center">
              Your profile will be hidden from search and discovery. You can come back anytime by logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50/50 rounded-xl p-4 text-sm text-amber-800 space-y-2">
            <p className="font-medium">What happens:</p>
            <ul className="space-y-1 text-xs text-amber-700">
              <li>✓ Your profile is hidden from everyone</li>
              <li>✓ No one can search or view your profile</li>
              <li>✓ Existing conversations remain (paused)</li>
              <li>✓ Your data is preserved — nothing deleted</li>
              <li>✓ Reactivate anytime by logging back in</li>
            </ul>
          </div>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeactivateOpen(false)}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleDeactivate}
              disabled={deactivating}
            >
              {deactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog — hard delete: permanently removes account, frees email/phone for reuse */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
              <AlertTriangle className="h-7 w-7 text-rose-600" />
            </div>
            <DialogTitle className="text-center">Delete Account Permanently?</DialogTitle>
            <DialogDescription className="text-center">
              This cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-50/50 rounded-xl p-4 text-sm text-rose-800 space-y-2">
            <p className="font-medium">What will be deleted:</p>
            <ul className="space-y-1 text-xs text-rose-700">
              <li>✗ Your profile, photos, and preferences</li>
              <li>✗ All conversations and matches</li>
              <li>✗ Interests, shortlists, and history</li>
              <li>✗ Active subscription will be cancelled</li>
              <li>✓ Email & phone freed — can sign up again later</li>
            </ul>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Type <span className="font-mono font-bold text-rose-700">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={deleting}
              className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDelete}
              disabled={deleting || deleteConfirmText !== 'DELETE'}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Forever
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
