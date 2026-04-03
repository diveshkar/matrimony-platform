import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

const prompts = [
  'What are your hobbies and interests?',
  'What values are important to you?',
  'What are you looking for in a life partner?',
  'What does a perfect weekend look like for you?',
];

export function StepAboutMe({ data, onChange }: StepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Write a few lines about yourself. This is your chance to make a great first impression.
      </p>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">About Me</label>
        <textarea
          value={data.aboutMe || ''}
          onChange={(e) => onChange({ aboutMe: e.target.value })}
          placeholder="Tell potential matches about yourself..."
          rows={6}
          maxLength={2000}
          className="flex w-full rounded-lg border border-input bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {(data.aboutMe || '').length} / 2000
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Need inspiration? Try answering:</p>
        <ul className="space-y-2">
          {prompts.map((prompt) => (
            <li key={prompt} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary-400 mt-0.5">•</span>
              {prompt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
