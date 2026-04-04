import { useQuery } from '@tanstack/react-query';
import { discoveryApi, type SearchFilters } from '../api/discovery-api';

export function useRecommendations(limit = 20) {
  return useQuery({
    queryKey: ['recommendations', limit],
    queryFn: () => discoveryApi.getRecommendations(limit),
    staleTime: 1000 * 30, // Consider fresh for 30 seconds only
    refetchOnWindowFocus: true,
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
