import { useState, useCallback } from 'react';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
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
} from '@/lib/constants/enums';
import type { SearchFilters } from '../api/discovery-api';

const countries = [
  'United Kingdom',
  'Sri Lanka',
  'India',
  'Canada',
  'Australia',
  'United States',
  'United Arab Emirates',
  'Germany',
  'France',
];

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
      <PageHeader
        title="Search Profiles"
        description={profiles.length > 0 ? `${profiles.length} profiles found` : 'Find your match'}
        action={
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2 h-5 w-5 p-0 justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        }
      />

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <div
          className={cn(
            'w-full md:w-64 shrink-0 space-y-4',
            showFilters ? 'block' : 'hidden md:block',
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm">Filters</h3>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
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
                className="h-9 text-xs"
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
                className="h-9 text-xs"
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
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterSection>

          {/* Religion */}
          <FilterSection label="Religion">
            <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-2">
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
            <Button className="w-full mt-4" onClick={() => setShowFilters(false)}>
              Show Results
            </Button>
          )}
        </div>

        {/* Results */}
        <div className={cn('flex-1', showFilters && isMobile ? 'hidden' : 'block')}>
          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/5] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && profiles.length === 0 && (
            <EmptyState
              icon={<SearchIcon className="h-8 w-8" />}
              title="No profiles found"
              description={hasFilters ? 'Try adjusting your filters' : 'No profiles available yet'}
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          )}

          {!isLoading && profiles.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <ProfileCard key={profile.userId} profile={profile} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
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
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        active
          ? 'border-primary-700 bg-primary-50 text-primary-800'
          : 'border-border hover:border-primary-300 text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}
