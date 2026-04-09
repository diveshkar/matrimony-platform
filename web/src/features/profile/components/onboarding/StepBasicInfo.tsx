import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { DateOfBirthInput } from '@/components/common/DateOfBirthInput';
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, HEIGHT_OPTIONS } from '@/lib/constants/enums';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

export function StepBasicInfo({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
        <Input
          value={data.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Enter full name"
          error={!!errors.name}
        />
        {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
      </div>

      {/* DOB */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Date of Birth *</label>
        <DateOfBirthInput
          value={data.dateOfBirth || ''}
          onChange={(val) => onChange({ dateOfBirth: val })}
          error={!!errors.dateOfBirth}
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-destructive">{errors.dateOfBirth}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Gender *</label>
        <div className="flex gap-3">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ gender: option.value })}
              className={cn(
                'flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                data.gender === option.value
                  ? 'border-primary-700 bg-primary-50 text-primary-800'
                  : 'border-border hover:border-primary-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.gender && <p className="mt-1 text-sm text-destructive">{errors.gender}</p>}
      </div>

      {/* Height */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Height *</label>
        <select
          value={data.height || ''}
          onChange={(e) => onChange({ height: Number(e.target.value) })}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            errors.height ? 'border-destructive' : 'border-input hover:border-primary-300',
          )}
        >
          <option value="">Select height</option>
          {HEIGHT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.height && <p className="mt-1 text-sm text-destructive">{errors.height}</p>}
      </div>

      {/* Marital Status */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Marital Status *</label>
        <div className="grid grid-cols-2 gap-3">
          {MARITAL_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ maritalStatus: option.value })}
              className={cn(
                'py-3 rounded-lg border-2 text-sm font-medium transition-all',
                data.maritalStatus === option.value
                  ? 'border-primary-700 bg-primary-50 text-primary-800'
                  : 'border-border hover:border-primary-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.maritalStatus && (
          <p className="mt-1 text-sm text-destructive">{errors.maritalStatus}</p>
        )}
      </div>
    </div>
  );
}
