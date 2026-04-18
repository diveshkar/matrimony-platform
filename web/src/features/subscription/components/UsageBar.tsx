import { Link } from 'react-router-dom';
import { Eye, Heart, MessageCircle, Crown, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import { useUsage } from '../hooks/useSubscription';

export function UsageBar({ className }: { className?: string }) {
  const { data: usageRes } = useUsage();
  const usage = usageRes?.success ? usageRes.data : null;
  const isUnlimited = usage?.profileViewsRemaining === -1 && usage?.interestsRemaining === -1;

  if (!usage) return null;

  return (
    <div className={cn('rounded-xl bg-white shadow-soft-sm p-3 sm:p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Monthly Usage
        </p>
        {!isUnlimited && (
          <Link to={ROUTES.PLANS}>
            <Badge variant="outline" className="text-[9px] gap-1 cursor-pointer hover:bg-primary-50">
              <Crown className="h-2.5 w-2.5" />
              Upgrade
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Profile Views */}
        <UsageItem
          icon={Eye}
          label="Profile Views"
          remaining={usage.profileViewsRemaining}
          unlimited={isUnlimited}
          color="text-blue-600"
          bg="bg-blue-50"
          barColor="bg-blue-500"
        />

        {/* Interests */}
        <UsageItem
          icon={Heart}
          label="Interests"
          remaining={usage.interestsRemaining}
          unlimited={isUnlimited}
          color="text-rose-600"
          bg="bg-rose-50"
          barColor="bg-rose-500"
        />

        {/* Chat */}
        <FeatureItem
          icon={MessageCircle}
          label="Chat"
          enabled={usage.chatAccess}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />

        {/* Who Viewed */}
        <FeatureItem
          icon={Eye}
          label="Who Viewed"
          enabled={usage.whoViewedMeAccess}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>
    </div>
  );
}

function UsageItem({
  icon: Icon,
  label,
  remaining,
  unlimited,
  color,
  bg,
  barColor,
}: {
  icon: typeof Eye;
  label: string;
  remaining: number;
  unlimited: boolean;
  color: string;
  bg: string;
  barColor: string;
}) {
  const maxMap: Record<number, number> = { 5: 5, 10: 10, 15: 15, 25: 25, 30: 30 };
  const max = unlimited ? 1 : Object.values(maxMap).find((m) => remaining <= m) || 30;
  const pct = unlimited ? 100 : Math.round((remaining / max) * 100);
  const isLow = !unlimited && remaining <= 2;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className={cn('flex h-5 w-5 items-center justify-center rounded', bg)}>
          <Icon className={cn('h-3 w-3', color)} />
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-sm font-bold', isLow ? 'text-destructive' : 'text-foreground')}>
        {unlimited ? '∞' : remaining}
        {!unlimited && <span className="text-[10px] font-normal text-muted-foreground"> left this month</span>}
      </p>
      {!unlimited && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', isLow ? 'bg-destructive' : barColor)}
            style={{ width: `${Math.max(pct, 5)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  label,
  enabled,
  color,
  bg,
}: {
  icon: typeof Eye;
  label: string;
  enabled: boolean;
  color: string;
  bg: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className={cn('flex h-5 w-5 items-center justify-center rounded', enabled ? bg : 'bg-muted')}>
          {enabled ? (
            <Icon className={cn('h-3 w-3', color)} />
          ) : (
            <Lock className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-xs font-semibold', enabled ? 'text-emerald-600' : 'text-muted-foreground')}>
        {enabled ? 'Enabled' : 'Locked'}
      </p>
    </div>
  );
}
