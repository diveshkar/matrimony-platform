import { Input } from '@/components/ui/input';
import { EDUCATION_OPTIONS, EDUCATION_FIELD_OPTIONS, OCCUPATION_OPTIONS, INCOME_OPTIONS } from '@/lib/constants/enums';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

const selectClass = 'flex h-11 w-full rounded-lg border border-input bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-primary-300';

export function StepEducationCareer({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-5">
      {/* Education */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Education Level *</label>
        <select
          value={data.education || ''}
          onChange={(e) => onChange({ education: e.target.value })}
          className={`${selectClass} ${errors.education ? 'border-destructive' : ''}`}
        >
          <option value="">Select education level</option>
          {EDUCATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.education && <p className="mt-1 text-sm text-destructive">{errors.education}</p>}
      </div>

      {/* Education Field */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Field of Study</label>
        <select
          value={data.educationField || ''}
          onChange={(e) => onChange({ educationField: e.target.value })}
          className={selectClass}
        >
          <option value="">Select field of study</option>
          {EDUCATION_FIELD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Occupation */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Occupation</label>
        <select
          value={data.occupation || ''}
          onChange={(e) => onChange({ occupation: e.target.value })}
          className={selectClass}
        >
          <option value="">Select occupation</option>
          {OCCUPATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Employer */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Employer</label>
        <Input
          value={data.employer || ''}
          onChange={(e) => onChange({ employer: e.target.value })}
          placeholder="Company name (optional)"
        />
      </div>

      {/* Income */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Annual Income Range</label>
        <select
          value={data.incomeRange || ''}
          onChange={(e) => onChange({ incomeRange: e.target.value })}
          className={selectClass}
        >
          <option value="">Prefer not to say</option>
          {INCOME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
