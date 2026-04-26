import { Link } from 'react-router-dom';
import { ArrowRight, User as UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useOutbox } from '@/features/interests/hooks/useInterests';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { ROUTES, profileDetailPath } from '@/lib/constants/routes';
import { formatRelativeTime } from '@/lib/utils/format';

/**
 * "Congratulations! They like you too" — single featured mutual match
 * with an embedded "Why wait? Connect now" CTA.
 *
 * Free users → tap routes to /plans (the only place to unlock chat).
 * Paid users → tap routes straight to /chats.
 *
 * Returns null when the user has zero accepted interests so the
 * dashboard never renders an empty hero.
 */
export function MutualMatchSpotlight() {
  const { data: outboxRes } = useOutbox();
  const { data: subRes } = useMySubscription();

  const accepted = outboxRes?.success
    ? [...outboxRes.data.items]
        .filter((i) => i.status === 'accepted')
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
    : [];

  if (accepted.length === 0) return null;

  const featured = accepted[0];
  const remaining = accepted.length - 1;
  const planId = subRes?.success ? subRes.data.subscription.planId : 'free';
  const isFree = planId === 'free';
  const firstName = featured.receiverName?.split(' ')[0] ?? '';
  const ctaHref = isFree ? ROUTES.PLANS : ROUTES.CHATS;
  const ctaLabel = isFree ? 'Why wait? Connect now' : `Message ${firstName}`;

  return (
    <section>
      <h2 className="font-heading font-semibold text-lg mb-4">
        Congratulations! They like you too
      </h2>
      <Card className="border border-accent-200/60 bg-gradient-to-br from-accent-50/40 via-warm-50 to-white shadow-soft overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl overflow-hidden bg-primary-50 ring-2 ring-accent-200/60">
              {featured.receiverPhoto ? (
                <img
                  src={featured.receiverPhoto}
                  alt={featured.receiverName || 'Match'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-primary-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="font-heading text-xl font-bold leading-tight">
                {featured.receiverName || 'Your match'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Accepted your interest · {formatRelativeTime(featured.updatedAt)}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 items-center sm:items-start">
                <Link
                  to={ctaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white text-sm font-medium px-5 py-2.5 shadow-soft-sm w-full sm:w-auto"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={profileDetailPath(featured.receiverId)}
                  className="inline-flex items-center justify-center text-sm text-primary-700 hover:underline font-medium px-2 py-2"
                >
                  View profile
                </Link>
              </div>
            </div>
          </div>

          {remaining > 0 && (
            <p className="mt-5 pt-4 border-t border-accent-100/60 text-center text-xs text-muted-foreground">
              <span className="font-semibold tabular-nums tracking-tight">{remaining}</span>
              {remaining === 1 ? ' other match is also waiting' : ' other matches are also waiting'}
              {' · '}
              <Link
                to={ROUTES.INTERESTS}
                className="text-primary-700 hover:underline font-medium"
              >
                See all
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
