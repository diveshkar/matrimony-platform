import { Link } from 'react-router-dom';
import { Eye, User, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { UpgradePrompt } from '@/features/subscription/components/UpgradePrompt';
import { formatRelativeTime } from '@/lib/utils/format';
import { profileDetailPath } from '@/lib/constants/routes';
import { useWhoViewedMe } from '../hooks/useSettings';
import { AxiosError } from 'axios';

export default function WhoViewedMePage() {
  const { data: response, isLoading, error } = useWhoViewedMe();

  // Check if blocked by plan (403)
  const isForbidden = error instanceof AxiosError && error.response?.status === 403;
  if (isForbidden) {
    return (
      <div className="space-y-4 max-w-2xl">
        <PageHeader title="Who Viewed Me" />
        <UpgradePrompt
          title="Upgrade to see who viewed you"
          description="Who Viewed Me is available on Silver plan and above."
        />
      </div>
    );
  }

  const views = response?.success ? response.data.items : [];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="Who Viewed Me" description={`${views.length} profile views`} />

      {views.length === 0 ? (
        <EmptyState
          icon={<Eye className="h-8 w-8" />}
          title="No views yet"
          description="When someone views your profile, they will appear here."
        />
      ) : (
        <div className="space-y-2">
          {views.map((view, i) => (
            <Link key={`${view.viewerId}-${i}`} to={profileDetailPath(view.viewerId)}>
              <Card className="border-0 shadow-soft-sm hover:shadow-soft transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-primary-50 shrink-0">
                    {view.viewerPhoto ? (
                      <img src={view.viewerPhoto} alt={view.viewerName} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-sm truncate" title={view.viewerName}>
                      {view.viewerName || 'Someone'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {view.viewerAge && <span>{view.viewerAge}y</span>}
                      {view.viewerCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{view.viewerCity}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelativeTime(view.createdAt)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
