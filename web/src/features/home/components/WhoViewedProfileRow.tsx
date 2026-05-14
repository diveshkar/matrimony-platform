import { Link } from 'react-router-dom';
import { ChevronRight, Crown, Eye, MapPin, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useWhoViewedMe } from '@/features/settings/hooks/useSettings';
import { profileDetailPath, ROUTES } from '@/lib/constants/routes';
import { formatRelativeTime } from '@/lib/utils/format';

export function WhoViewedProfileRow() {
  const { data } = useWhoViewedMe();

  if (!data?.success) return null;

  const views = data.data.items;
  const viewCount = (data.data as unknown as { count?: number }).count || views.length;
  const tier = (data.data as unknown as { tier?: string }).tier;
  const isCountOnly = tier === 'count_only';

  if (viewCount === 0) return null;

  const caption =
    viewCount === 1
      ? '1 member viewed your profile'
      : `${viewCount} members viewed your profile`;

  const planLabel = (planId?: string) => {
    if (!planId) return 'Free';
    return planId.charAt(0).toUpperCase() + planId.slice(1);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="font-heading font-semibold text-lg">Who viewed your profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {caption}
          </p>
        </div>
        <Link
          to={ROUTES.WHO_VIEWED}
          className="text-xs text-primary-700 hover:underline font-medium flex items-center gap-1 shrink-0"
        >
          See all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {isCountOnly ? (
        <Link
          to={ROUTES.PLANS}
          className="block rounded-2xl bg-white shadow-soft-sm border border-accent-100 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50">
              <Eye className="h-5 w-5 text-accent-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold text-sm">Unlock viewer details</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to see names, photos, and visit profiles.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary-700 shrink-0" />
          </div>
        </Link>
      ) : (
        <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
          <div className="flex gap-3 px-4 sm:px-0 min-w-max">
            {views.slice(0, 8).map((view, index) => (
              <Link
                key={`${view.viewerId}-${index}`}
                to={profileDetailPath(view.viewerId)}
                className="w-48 shrink-0 rounded-2xl bg-white shadow-soft-sm border border-transparent hover:border-primary-200 transition-colors overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[4/5] bg-primary-50">
                  {view.viewerPhoto ? (
                    <img
                      src={view.viewerPhoto}
                      alt={view.viewerName || 'Member'}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-warm-100">
                      <UserIcon className="h-10 w-10 text-primary-300" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-medium text-primary-800 shadow-soft-sm">
                    {formatRelativeTime(view.createdAt)}
                  </span>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-heading font-semibold text-sm truncate">
                      {view.viewerName || 'Member'}
                    </p>
                    <Badge
                      variant={view.viewerPlanId && view.viewerPlanId !== 'free' ? 'gold' : 'outline'}
                      className="shrink-0 px-1.5 py-0 text-[8px]"
                    >
                      {view.viewerPlanId && view.viewerPlanId !== 'free' && (
                        <Crown className="mr-0.5 h-2.5 w-2.5" />
                      )}
                      {planLabel(view.viewerPlanId)}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
                    {view.viewerAge && <span className="shrink-0">{view.viewerAge}y</span>}
                    {(view.viewerCity || view.viewerCountry) && (
                      <>
                        {view.viewerAge && <span className="shrink-0">·</span>}
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {view.viewerCity || view.viewerCountry}
                        </span>
                      </>
                    )}
                  </div>
                  {view.viewerAboutMe && (
                    <p className="mt-2 text-[10px] leading-snug text-muted-foreground line-clamp-2">
                      {view.viewerAboutMe}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
