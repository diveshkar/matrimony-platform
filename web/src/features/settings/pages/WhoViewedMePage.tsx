import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, User, MapPin, Crown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { UpgradePrompt } from '@/features/subscription/components/UpgradePrompt';
import { formatRelativeTime } from '@/lib/utils/format';
import { profileDetailPath, ROUTES } from '@/lib/constants/routes';
import { useWhoViewedMe } from '../hooks/useSettings';
import { AxiosError } from 'axios';

export default function WhoViewedMePage() {
  const { data: response, isLoading, error } = useWhoViewedMe();

  const isForbidden = error instanceof AxiosError && error.response?.status === 403;
  if (isForbidden) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Who Viewed Me</h1>
        <UpgradePrompt
          title="Upgrade to see who viewed you"
          description="Who Viewed Me is available on Silver plan and above."
        />
      </div>
    );
  }

  const views = response?.success ? response.data.items : [];
  const viewCount = response?.success ? (response.data as unknown as { count?: number }).count || views.length : 0;
  const tier = response?.success ? (response.data as unknown as { tier?: string }).tier : 'full';
  const isCountOnly = tier === 'count_only';

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Who Viewed Me</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {viewCount} profile view{viewCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Silver tier: count only */}
      {isCountOnly && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-soft-lg overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Users className="h-8 w-8 text-accent-400" />
              </div>
              <p className="text-4xl sm:text-5xl font-heading font-bold text-white mb-2">{viewCount}</p>
              <p className="text-sm text-white/70">
                {viewCount === 1 ? 'person has' : 'people have'} viewed your profile
              </p>
            </div>

            <CardContent className="p-5 sm:p-6">
              <div className="space-y-3 mb-5">
                {[...Array(Math.min(viewCount, 3))].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-warm-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary-300" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 bg-primary-100 rounded-full" />
                      <div className="h-2 w-16 bg-primary-50 rounded-full" />
                    </div>
                    <div className="h-2 w-10 bg-primary-50 rounded-full" />
                  </div>
                ))}
              </div>

              <div className="bg-accent-50/50 rounded-xl p-4 text-center mb-4">
                <p className="text-sm font-medium text-accent-800">
                  Upgrade to Gold to see who viewed your profile
                </p>
                <p className="text-xs text-accent-600 mt-1">
                  See names, photos, and visit their profiles directly
                </p>
              </div>

              <Button className="w-full rounded-xl shadow-glow" asChild>
                <Link to={ROUTES.PLANS}>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Gold
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gold/Platinum tier: full list */}
      {!isCountOnly && views.length === 0 && (
        <EmptyState
          icon={<Eye className="h-8 w-8" />}
          title="No views yet"
          description="When someone views your profile, they will appear here."
        />
      )}

      {!isCountOnly && views.length > 0 && (
        <div className="space-y-2">
          {views.map((view, i) => (
            <motion.div
              key={`${view.viewerId}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={profileDetailPath(view.viewerId)}>
                <Card className="border-0 shadow-soft-sm hover:shadow-soft transition-shadow rounded-xl">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-primary-50 shrink-0">
                      {view.viewerPhoto ? (
                        <img
                          src={view.viewerPhoto}
                          alt={view.viewerName}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-heading font-semibold text-sm truncate"
                        title={view.viewerName}
                      >
                        {view.viewerName || 'Someone'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {view.viewerAge && <span>{view.viewerAge}y</span>}
                        {view.viewerCity && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {view.viewerCity}
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
