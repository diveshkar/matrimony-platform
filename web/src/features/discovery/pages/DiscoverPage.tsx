import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, Heart, Users, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UsageBar } from '@/features/subscription/components/UsageBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ProfileCard } from '../components/ProfileCard';
import { useRecommendations } from '../hooks/useDiscovery';
import { ROUTES } from '@/lib/constants/routes';

export default function DiscoverPage() {
  const { data: response, isLoading, isError, refetch } = useRecommendations();

  const profiles = response?.success ? response.data.items : [];

  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent-400/10 blur-[60px]" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary-400/10 blur-[50px]" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-400" />
              Your Matches
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Profiles recommended based on your preferences
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-center">
            <Button variant="secondary" size="sm" className="gap-2" asChild>
              <Link to={ROUTES.RECENTLY_JOINED}>
                <Clock className="h-4 w-4" />
                New Profiles
              </Link>
            </Button>
            <Button variant="secondary" size="sm" className="gap-2" asChild>
              <Link to={ROUTES.SEARCH}>
                <Search className="h-4 w-4" />
                Search
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Usage */}
      <UsageBar />

      {/* Results */}
      {isLoading && (
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="Could not load matches"
          description="Please try again."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      )}

      {!isLoading && !isError && profiles.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
            <Heart className="h-8 w-8 text-primary-300" />
          </div>
          <h3 className="font-heading text-lg font-semibold">No matches yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Complete your profile and preferences so we can find the best matches for you.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild>
              <Link to={ROUTES.SEARCH}>
                <Search className="mr-2 h-4 w-4" />
                Search Profiles
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={ROUTES.MY_PROFILE}>Complete Profile</Link>
            </Button>
          </div>
        </div>
      )}

      {profiles.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {profiles.length} match{profiles.length !== 1 ? 'es' : ''} found
              </span>
            </div>
            <Link
              to={ROUTES.SEARCH}
              className="text-xs text-primary-700 hover:underline font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {profiles.map((profile, i) => (
              <motion.div
                key={profile.userId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ProfileCard profile={profile} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
