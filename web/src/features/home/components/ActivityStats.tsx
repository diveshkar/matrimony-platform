import { Link } from 'react-router-dom';
import { Eye, Heart, Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useInbox, useOutbox } from '@/features/interests/hooks/useInterests';
import { useWhoViewedMe } from '@/features/settings/hooks/useSettings';
import { ROUTES } from '@/lib/constants/routes';

/**
 * "A quick look at your journey so far" — three stat cards summarising
 * the user's recent activity. Hidden entirely for new accounts with no
 * activity yet so the dashboard never shows hollow zero-state cards.
 */
export function ActivityStats() {
  const { data: viewsRes } = useWhoViewedMe();
  const { data: inboxRes } = useInbox();
  const { data: outboxRes } = useOutbox();

  const totalViews = viewsRes?.success
    ? (viewsRes.data as { items?: unknown[] }).items?.length ?? 0
    : 0;
  const acceptedCount = outboxRes?.success
    ? outboxRes.data.items.filter((i) => i.status === 'accepted').length
    : 0;
  const pendingCount = inboxRes?.success
    ? inboxRes.data.items.filter((i) => i.status === 'pending').length
    : 0;

  if (totalViews + acceptedCount + pendingCount === 0) return null;

  const stats = [
    {
      key: 'views',
      count: totalViews,
      icon: Eye,
      label: totalViews === 1 ? 'Member viewed your profile' : 'Members viewed your profile',
      href: ROUTES.WHO_VIEWED,
      bg: 'bg-primary-50',
      text: 'text-primary-700',
    },
    {
      key: 'accepted',
      count: acceptedCount,
      icon: Heart,
      label:
        acceptedCount === 1 ? 'Member accepted your interest' : 'Members accepted your interest',
      href: ROUTES.INTERESTS,
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
    {
      key: 'pending',
      count: pendingCount,
      icon: Inbox,
      label:
        pendingCount === 1 ? 'Member expressed interest' : 'Members expressed interest',
      href: ROUTES.INTERESTS,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
  ];

  return (
    <section>
      <h2 className="font-heading font-semibold text-lg mb-4">
        A quick look at your journey so far
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Link
            key={s.key}
            to={s.href}
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <Card className="h-full border-0 shadow-soft transition-shadow hover:shadow-soft-lg">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.bg}`}
                  >
                    <s.icon className={`h-5 w-5 ${s.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold text-2xl leading-none tabular-nums tracking-tight">
                      {s.count}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                      {s.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
