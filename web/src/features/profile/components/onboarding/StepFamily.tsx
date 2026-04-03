import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { FAMILY_TYPE_OPTIONS, FAMILY_STATUS_OPTIONS, FAMILY_VALUES_OPTIONS } from '@/lib/constants/enums';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

export function StepFamily({ data, onChange, errors: _errors }: StepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">All fields on this page are optional.</p>

      {/* Father's Occupation */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Father&apos;s Occupation</label>
        <Input
          value={data.fatherOccupation || ''}
          onChange={(e) => onChange({ fatherOccupation: e.target.value })}
          placeholder="e.g. Businessman, Retired Teacher"
        />
      </div>

      {/* Mother's Occupation */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Mother&apos;s Occupation</label>
        <Input
          value={data.motherOccupation || ''}
          onChange={(e) => onChange({ motherOccupation: e.target.value })}
          placeholder="e.g. Homemaker, Doctor"
        />
      </div>

      {/* Siblings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Brothers</label>
          <Input
            type="number" min={0} max={15}
            value={data.brothersCount ?? ''}
            onChange={(e) => onChange({ brothersCount: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Sisters</label>
          <Input
            type="number" min={0} max={15}
            value={data.sistersCount ?? ''}
            onChange={(e) => onChange({ sistersCount: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Family Type */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Family Type</label>
        <div className="flex gap-3">
          {FAMILY_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ familyType: option.value })}
              className={cn(
                'flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                data.familyType === option.value
                  ? 'border-primary-700 bg-primary-50 text-primary-800'
                  : 'border-border hover:border-primary-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Family Status */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Family Status</label>
        <div className="flex gap-3">
          {FAMILY_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ familyStatus: option.value })}
              className={cn(
                'flex-1 py-2.5 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all',
                data.familyStatus === option.value
                  ? 'border-primary-700 bg-primary-50 text-primary-800'
                  : 'border-border hover:border-primary-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Family Values */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Family Values</label>
        <div className="flex gap-3">
          {FAMILY_VALUES_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ familyValues: option.value })}
              className={cn(
                'flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                data.familyValues === option.value
                  ? 'border-primary-700 bg-primary-50 text-primary-800'
                  : 'border-border hover:border-primary-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
