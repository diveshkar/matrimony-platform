import { Link } from 'react-router-dom';
import { ChevronRight, User as UserIcon } from 'lucide-react';
import { useInbox } from '@/features/interests/hooks/useInterests';
import { ROUTES } from '@/lib/constants/routes';
import { formatRelativeTime } from '@/lib/utils/format';

/**
 * "X members are awaiting your response" — horizontal scroll row of
 * pending received interests with a "Today" recency badge on cards
 * received in the last 24 hours.
 *
 * Returns null when the user has zero pending interests.
 */
export function PendingInterestsRow() {
  const { data } = useInbox();

  const pending = data?.success
    ? [...data.data.items]
        .filter((i) => i.status === 'pending')
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];

  if (pending.length === 0) return null;

  const headingTail =
    pending.length === 1
      ? ' member is awaiting your response'
      : ' members are awaiting your response';

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-heading font-semibold text-lg min-w-0 truncate">
          <span className="font-sans tabular-nums tracking-tight">{pending.length}</span>
          {headingTail}
        </h2>
        <Link
          to={ROUTES.INTERESTS}
          className="text-xs text-primary-700 hover:underline font-medium flex items-center gap-1 shrink-0"
        >
          See all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
        <div className="flex gap-3 px-4 sm:px-0 min-w-max">
          {pending.slice(0, 8).map((interest) => {
            const receivedToday =
              Date.now() - new Date(interest.createdAt).getTime() < 24 * 3600_000;
            return (
              <Link
                key={interest.senderId}
                to={ROUTES.INTERESTS}
                className="w-36 shrink-0 rounded-2xl bg-white shadow-soft-sm border border-transparent hover:border-primary-200 transition-colors overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-primary-50">
                  {interest.senderPhoto ? (
                    <img
                      src={interest.senderPhoto}
                      alt={interest.senderName || 'Member'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <UserIcon className="h-10 w-10 text-primary-300" />
                    </div>
                  )}
                  {receivedToday && (
                    <span className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-heading font-semibold text-sm truncate">
                    {interest.senderName || 'Member'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Received {formatRelativeTime(interest.createdAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
