import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  RELIGION_OPTIONS, CASTE_OPTIONS, COUNTRY_OPTIONS,
  EDUCATION_OPTIONS, MARITAL_STATUS_OPTIONS,
} from '@/lib/constants/enums';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

// Flatten all caste options for multi-select
const allCasteOptions = Object.values(CASTE_OPTIONS)
  .flat()
  .filter((v, i, a) => a.findIndex((x) => x.value === v.value) === i);

export function StepPreferences({ data, onChange, errors: _errors }: StepProps) {
  const prefs = data.preferences || { ageMin: 18, ageMax: 45 };

  const updatePref = (key: string, value: unknown) => {
    onChange({ preferences: { ...prefs, [key]: value } });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Tell us what you are looking for in a partner. All fields are optional.
      </p>

      {/* Age Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Age Range</label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={18} max={70}
            value={prefs.ageMin ?? ''}
            onChange={(e) => updatePref('ageMin', e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="18"
            className="w-24"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            min={18} max={70}
            value={prefs.ageMax ?? ''}
            onChange={(e) => updatePref('ageMax', e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="45"
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">years</span>
        </div>
      </div>

      {/* Height Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Height Range (cm)</label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={120} max={220}
            value={prefs.heightMin || ''}
            onChange={(e) => updatePref('heightMin', Number(e.target.value) || undefined)}
            placeholder="Min"
            className="w-24"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            min={120} max={220}
            value={prefs.heightMax || ''}
            onChange={(e) => updatePref('heightMax', Number(e.target.value) || undefined)}
            placeholder="Max"
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">cm</span>
        </div>
      </div>

      {/* Preferred Religions — Multi-select */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Preferred Religion(s)</label>
        <MultiSelect
          options={RELIGION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={prefs.religions || []}
          onChange={(val) => updatePref('religions', val)}
          placeholder="Select religions..."
        />
      </div>

      {/* Preferred Castes — Multi-select */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Preferred Caste(s)</label>
        <MultiSelect
          options={allCasteOptions}
          value={prefs.castes || []}
          onChange={(val) => updatePref('castes', val)}
          placeholder="Select castes..."
        />
      </div>

      {/* Preferred Countries — Multi-select */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Preferred Country(ies)</label>
        <MultiSelect
          options={COUNTRY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={prefs.countries || []}
          onChange={(val) => updatePref('countries', val)}
          placeholder="Select countries..."
        />
      </div>

      {/* Preferred Education — Multi-select */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Preferred Education</label>
        <MultiSelect
          options={EDUCATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={prefs.educations || []}
          onChange={(val) => updatePref('educations', val)}
          placeholder="Select education levels..."
        />
      </div>

      {/* Preferred Marital Status — Multi-select */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Preferred Marital Status</label>
        <MultiSelect
          options={MARITAL_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={prefs.maritalStatuses || []}
          onChange={(val) => updatePref('maritalStatuses', val)}
          placeholder="Select marital status..."
        />
      </div>
    </div>
  );
}
