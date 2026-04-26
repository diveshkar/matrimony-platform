import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ProfileCard } from '../components/ProfileCard';
import { useRecentlyJoined } from '../hooks/useDiscovery';
import { ROUTES } from '@/lib/constants/routes';

export default function RecentlyJoinedPage() {
  const { data: response, isLoading, isError, refetch } = useRecentlyJoined();

  const profiles = response?.success ? response.data.items : [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-600 via-accent-500 to-primary-600 p-6 sm:p-8"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-[60px]" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-[50px]" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link to={ROUTES.DISCOVER}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Joined
            </h1>
          </div>
          <p className="mt-2 text-sm text-white/70 ml-12">
            Discover new members who just joined our community
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      {profiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-6"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50">
              <Sparkles className="h-4 w-4 text-accent-600" />
            </div>
            <div>
              <p className="text-lg font-bold font-sans text-foreground tabular-nums tracking-tight">{profiles.length}</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5">New profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
              <Users className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-lg font-bold font-heading text-foreground">This week</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Joining period</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="Could not load new profiles"
          description="Please try again."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      )}

      {/* Empty */}
      {!isLoading && !isError && profiles.length === 0 && (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No new profiles yet"
          description="Check back soon as new members join every day."
          action={
            <Button asChild>
              <Link to={ROUTES.DISCOVER}>Browse Matches</Link>
            </Button>
          }
        />
      )}

      {/* Profile Grid */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.userId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ProfileCard profile={profile} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
