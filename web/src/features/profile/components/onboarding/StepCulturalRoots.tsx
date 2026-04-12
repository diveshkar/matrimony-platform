import { cn } from '@/lib/utils/cn';
import {
  RELIGION_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  CASTE_OPTIONS,
  DENOMINATION_OPTIONS,
  RAASI_OPTIONS,
  NATCHATHIRAM_OPTIONS,
} from '@/lib/constants/enums';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

export function StepCulturalRoots({ data, onChange, errors }: StepProps) {
  const casteOptions = data.religion ? CASTE_OPTIONS[data.religion] || [] : [];
  const denominationOptions = data.religion ? DENOMINATION_OPTIONS[data.religion] || [] : [];

  return (
    <div className="space-y-5">
      {/* Religion */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Religion *</label>
        <div className="grid grid-cols-2 gap-3">
          {RELIGION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange({ religion: option.value, caste: undefined, denomination: undefined })
              }
              className={cn(
                'py-3 rounded-lg border-2 text-sm font-medium transition-all',
                data.religion === option.value
                  ? 'border-primary-700 bg-primary-50 text-primary-800'
                  : 'border-border hover:border-primary-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.religion && <p className="mt-1 text-sm text-destructive">{errors.religion}</p>}
      </div>

      {/* Mother Tongue */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Mother Tongue *</label>
        <div className="flex gap-3">
          {MOTHER_TONGUE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ motherTongue: option.value })}
              className={cn(
                'flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                data.motherTongue === option.value
                  ? 'border-primary-700 bg-primary-50 text-primary-800'
                  : 'border-border hover:border-primary-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.motherTongue && (
          <p className="mt-1 text-sm text-destructive">{errors.motherTongue}</p>
        )}
      </div>

      {/* Caste — dropdown based on religion */}
      {casteOptions.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Caste / Community
          </label>
          <select
            value={data.caste || ''}
            onChange={(e) => onChange({ caste: e.target.value })}
            className="flex h-11 w-full rounded-lg border border-input bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select caste</option>
            {casteOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Denomination — dropdown based on religion */}
      {denominationOptions.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Denomination / Branch
          </label>
          <select
            value={data.denomination || ''}
            onChange={(e) => onChange({ denomination: e.target.value })}
            className="flex h-11 w-full rounded-lg border border-input bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select denomination</option>
            {denominationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Raasi */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Raasi (Zodiac Sign)</label>
        <select
          value={data.raasi || ''}
          onChange={(e) => onChange({ raasi: e.target.value })}
          className="flex h-11 w-full rounded-lg border border-input bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select raasi</option>
          {RAASI_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Natchathiram */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Natchathiram (Birth Star)</label>
        <select
          value={data.natchathiram || ''}
          onChange={(e) => onChange({ natchathiram: e.target.value })}
          className="flex h-11 w-full rounded-lg border border-input bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select natchathiram</option>
          {NATCHATHIRAM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
