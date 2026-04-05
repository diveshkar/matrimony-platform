import { useQuery } from '@tanstack/react-query';
import { discoveryApi, type SearchFilters } from '../api/discovery-api';
import { useAuth } from '@/lib/auth/auth-context';

export function useRecommendations(limit = 20) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['recommendations', limit],
    queryFn: () => discoveryApi.getRecommendations(limit),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
}

export function useRecentlyJoined() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['recently-joined'],
    queryFn: () => discoveryApi.search({ limit: 10 }),
    staleTime: 1000 * 60,
    enabled: isAuthenticated,
  });
}

export function useSearch(filters: SearchFilters, enabled = true) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => discoveryApi.search(filters),
    enabled,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}
