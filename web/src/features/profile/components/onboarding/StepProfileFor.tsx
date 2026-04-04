import { Users, User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PROFILE_FOR_OPTIONS } from '@/lib/constants/enums';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

const icons: Record<string, typeof User> = {
  self: User,
  son: Users,
  daughter: Users,
  brother: Users,
  sister: Users,
  relative: Heart,
  friend: Heart,
};

export function StepProfileFor({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PROFILE_FOR_OPTIONS.map((option) => {
          const Icon = icons[option.value] || User;
          const selected = data.profileFor === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ profileFor: option.value })}
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all',
                selected
                  ? 'border-primary-700 bg-primary-50 shadow-glow'
                  : 'border-border hover:border-primary-300 hover:bg-warm-50',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  selected ? 'bg-primary-700 text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  selected ? 'text-primary-800' : 'text-foreground',
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      {errors.profileFor && <p className="text-sm text-destructive">{errors.profileFor}</p>}
    </div>
  );
}
