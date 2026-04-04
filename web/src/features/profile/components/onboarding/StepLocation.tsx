import { Input } from '@/components/ui/input';
import { COUNTRY_OPTIONS } from '@/lib/constants/enums';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

export function StepLocation({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-5">
      {/* Country */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Country *</label>
        <select
          value={data.country || ''}
          onChange={(e) => onChange({ country: e.target.value })}
          className="flex h-11 w-full rounded-lg border border-input bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select country</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.country && <p className="mt-1 text-sm text-destructive">{errors.country}</p>}
      </div>

      {/* State */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">State / Province</label>
        <Input
          value={data.state || ''}
          onChange={(e) => onChange({ state: e.target.value })}
          placeholder="e.g. London, Tamil Nadu, Ontario"
        />
      </div>

      {/* City */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
        <Input
          value={data.city || ''}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="e.g. Harrow, Jaffna, Toronto"
        />
      </div>
    </div>
  );
}
