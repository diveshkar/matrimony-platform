import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';
import { usePrivacySettings, useUpdatePrivacy } from '../hooks/useSettings';

export default function PrivacySettingsPage() {
  const { data: response, isLoading } = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacy();

  const privacy = response?.success ? response.data : null;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl" asChild>
          <Link to={ROUTES.SETTINGS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Privacy Settings</h1>
          <p className="text-xs text-muted-foreground">Control who sees your information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-700" />
            Visibility Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ToggleRow
            label="Hide Phone Number"
            description="Your phone number will not be visible to others"
            checked={privacy?.hidePhone ?? true}
            onChange={(v) => updatePrivacy.mutate({ hidePhone: v })}
          />
          <ToggleRow
            label="Hide Date of Birth"
            description="Only your age will be shown, not your full date of birth"
            checked={privacy?.hideDob ?? false}
            onChange={(v) => updatePrivacy.mutate({ hideDob: v })}
          />
          <ToggleRow
            label="Show in Search Results"
            description="Your profile will appear when others search"
            checked={privacy?.showInSearch ?? true}
            onChange={(v) => updatePrivacy.mutate({ showInSearch: v })}
          />

          <div>
            <label className="text-sm font-medium block mb-1.5">Photo Visibility</label>
            <p className="text-xs text-muted-foreground mb-2">Who can see your photos</p>
            <select
              value={privacy?.photoVisibility ?? 'all'}
              onChange={(e) => updatePrivacy.mutate({ photoVisibility: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Everyone</option>
              <option value="contacts">Contacts Only</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Horoscope Visibility</label>
            <p className="text-xs text-muted-foreground mb-2">Who can see your horoscope</p>
            <select
              value={privacy?.horoscopeVisibility ?? 'all'}
              onChange={(e) => updatePrivacy.mutate({ horoscopeVisibility: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Everyone</option>
              <option value="contacts">Contacts Only</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-primary-700' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
