import { useState, useCallback } from 'react';
import { Search as SearchIcon, SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProfileCard } from '../components/ProfileCard';
import { useSearch } from '../hooks/useDiscovery';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils/cn';
import {
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
  EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  COUNTRY_OPTIONS,
} from '@/lib/constants/enums';
import type { SearchFilters } from '../api/discovery-api';

export default function SearchPage() {
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [filters, setFilters] = useState<SearchFilters>({});

  const debouncedFilters = useDebounce(filters, 400);
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  const { data: response, isLoading } = useSearch(debouncedFilters, true);
  const profiles = response?.success ? response.data.items : [];

  const updateFilter = useCallback((key: string, value: unknown) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined };
      if (!value) delete next[key as keyof SearchFilters];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '',
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            Search Profiles
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? 'Searching...'
              : profiles.length > 0
                ? `${profiles.length} profiles found`
                : 'Find your match'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="md:hidden gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="h-5 min-w-[20px] p-0 justify-center text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <div
          className={cn(
            'w-full md:w-60 shrink-0',
            showFilters ? 'block' : 'hidden md:block',
          )}
        >
          <Card className="border-0 shadow-soft sticky top-20">
            <CardContent className="pt-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-sm">Filters</h3>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] text-primary-700 hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Gender */}
              <FilterSection label="Gender">
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <FilterChip
                      key={opt.value}
                      label={opt.label}
                      active={filters.gender === opt.value}
                      onClick={() =>
                        updateFilter('gender', filters.gender === opt.value ? '' : opt.value)
                      }
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Age */}
              <FilterSection label="Age Range">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={18}
                    max={70}
                    placeholder="Min"
                    value={filters.ageMin || ''}
                    onChange={(e) =>
                      updateFilter('ageMin', e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="h-9 text-xs rounded-lg"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    min={18}
                    max={70}
                    placeholder="Max"
                    value={filters.ageMax || ''}
                    onChange={(e) =>
                      updateFilter('ageMax', e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </FilterSection>

              {/* Country */}
              <FilterSection label="Country">
                <select
                  value={filters.country || ''}
                  onChange={(e) => updateFilter('country', e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All countries</option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FilterSection>

              {/* Religion */}
              <FilterSection label="Religion">
                <div className="flex flex-wrap gap-1.5">
                  {RELIGION_OPTIONS.map((opt) => (
                    <FilterChip
                      key={opt.value}
                      label={opt.label}
                      active={filters.religion === opt.value}
                      onClick={() =>
                        updateFilter('religion', filters.religion === opt.value ? '' : opt.value)
                      }
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Education */}
              <FilterSection label="Education">
                <select
                  value={filters.education || ''}
                  onChange={(e) => updateFilter('education', e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Any education</option>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FilterSection>

              {/* Marital Status */}
              <FilterSection label="Marital Status">
                <div className="flex flex-wrap gap-1.5">
                  {MARITAL_STATUS_OPTIONS.map((opt) => (
                    <FilterChip
                      key={opt.value}
                      label={opt.label}
                      active={filters.maritalStatus === opt.value}
                      onClick={() =>
                        updateFilter(
                          'maritalStatus',
                          filters.maritalStatus === opt.value ? '' : opt.value,
                        )
                      }
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Has Photo */}
              <FilterSection label="Photo">
                <FilterChip
                  label="Has photo only"
                  active={filters.hasPhoto === true}
                  onClick={() => updateFilter('hasPhoto', !filters.hasPhoto)}
                />
              </FilterSection>

              {/* Apply on mobile */}
              {isMobile && showFilters && (
                <Button className="w-full mt-2 rounded-xl" onClick={() => setShowFilters(false)}>
                  Show {profiles.length} Results
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className={cn('flex-1', showFilters && isMobile ? 'hidden' : 'block')}>
          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && profiles.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <SearchIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-heading text-lg font-semibold">No profiles found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {hasFilters ? 'Try adjusting your filters' : 'No profiles available yet'}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {!isLoading && profiles.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {profiles.length} result{profiles.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {profiles.map((profile) => (
                  <ProfileCard key={profile.userId} profile={profile} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all',
        active
          ? 'border-primary-700 bg-primary-50 text-primary-800'
          : 'border-border hover:border-primary-300 text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}
