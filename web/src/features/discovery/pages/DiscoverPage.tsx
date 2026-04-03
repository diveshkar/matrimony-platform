import { Link } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileCard } from '../components/ProfileCard';
import { useRecommendations } from '../hooks/useDiscovery';
import { ROUTES } from '@/lib/constants/routes';

export default function DiscoverPage() {
  const { data: response, isLoading, isError } = useRecommendations();

  const profiles = response?.success ? response.data.items : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover Matches"
        description="Profiles recommended for you"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.SEARCH}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] rounded-xl" />
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
          description="Please try again later."
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      )}

      {!isLoading && !isError && profiles.length === 0 && (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="No matches yet"
          description="We are finding the best matches for you. Check back soon or try searching manually."
          action={
            <Button asChild>
              <Link to={ROUTES.SEARCH}>Search Profiles</Link>
            </Button>
          }
        />
      )}

      {profiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.userId} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
