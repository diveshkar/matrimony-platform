import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
    queryFn: () => discoveryApi.getRecentlyJoined(10, 7), // last 7 days, max 10
    staleTime: 1000 * 20,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
}

// export function useSearch(filters: SearchFilters, enabled = true) {
//   return useQuery({
//     queryKey: ['search', filters],
//     queryFn: () => discoveryApi.search(filters),
//     enabled,
//     staleTime: 1000 * 30,
//     refetchOnWindowFocus: true,
//   });
// }
export function useSearch(filters: SearchFilters, enabled = true) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => discoveryApi.search(filters),
    enabled,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    // FIXED: keeps previous data visible while new results load
    // so switching filters doesn't flash an empty screen
    placeholderData: keepPreviousData,
  });
}
