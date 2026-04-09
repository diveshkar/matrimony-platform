import { useState } from 'react';
import { Phone, CheckCircle2, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import type { ProfileData } from '../../api/profile-api';

interface StepProps {
  data: Partial<ProfileData>;
  onChange: (updates: Partial<ProfileData>) => void;
  errors: Record<string, string>;
}

const countryCodes = [
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+94', country: 'LK', flag: '🇱🇰' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
];

const countryToCode: Record<string, string> = {
  'United Kingdom': '+44',
  'Sri Lanka': '+94',
  'India': '+91',
  'United States': '+1',
  'Canada': '+1',
  'Australia': '+61',
  'UAE': '+971',
  'Germany': '+49',
  'France': '+33',
  'Singapore': '+65',
  'Malaysia': '+60',
  'New Zealand': '+64',
};

export function StepPhoneVerify({ data, onChange, errors }: StepProps) {
  const { user } = useAuth();

  const existingPhone = user?.phone;
  const hasPhoneFromLogin = !!existingPhone;

  const [countryCode, setCountryCode] = useState(() => {
    if (data.phoneNumber) {
      const match = countryCodes.find((cc) => data.phoneNumber?.startsWith(cc.code));
      return match?.code || '+44';
    }
    if (existingPhone) {
      const match = countryCodes.find((cc) => existingPhone.startsWith(cc.code));
      return match?.code || '+44';
    }
    if (data.country) {
      return countryToCode[data.country] || '+44';
    }
    return '+44';
  });

  const [localNumber, setLocalNumber] = useState(() => {
    const phone = data.phoneNumber || existingPhone || '';
    if (phone) {
      const match = countryCodes.find((cc) => phone.startsWith(cc.code));
      return match ? phone.slice(match.code.length) : phone.replace('+', '');
    }
    return '';
  });

  const handlePhoneChange = (num: string) => {
    setLocalNumber(num);
    const full = `${countryCode}${num.replace(/\s/g, '')}`;
    if (num.length >= 6) {
      onChange({ phoneNumber: full });
    } else {
      onChange({ phoneNumber: undefined });
    }
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    if (localNumber.length >= 6) {
      onChange({ phoneNumber: `${code}${localNumber.replace(/\s/g, '')}` });
    }
  };

  if (hasPhoneFromLogin) {
    if (!data.phoneNumber) {
      onChange({ phoneNumber: existingPhone });
    }

    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-emerald-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-heading font-semibold text-emerald-800">Phone Already Verified</h3>
          <p className="mt-1 text-sm text-emerald-700">{existingPhone}</p>
          <Badge variant="success" className="mt-2 text-[10px]">
            Verified via WhatsApp Login
          </Badge>
        </div>

        <div className="bg-primary-50/50 rounded-xl p-4 text-xs text-primary-700 space-y-1.5">
          <p className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            Your phone number is verified and linked to your account
          </p>
          <p className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            This builds trust with other members and their families
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        A verified phone number builds trust with other members and their families. This is required to complete your profile.
      </p>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Mobile Phone Number <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="flex h-12 rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-[115px]"
          >
            {countryCodes.map((cc) => (
              <option key={cc.code} value={cc.code}>
                {cc.flag} {cc.code}
              </option>
            ))}
          </select>
          <Input
            type="tel"
            placeholder="7911 123456"
            value={localNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            error={!!errors.phoneNumber}
            className="flex-1 h-12 rounded-xl"
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-xs text-destructive mt-1.5">{errors.phoneNumber}</p>
        )}
      </div>

      <div className="bg-primary-50/50 rounded-xl p-4 text-xs text-primary-700 space-y-1.5">
        <p className="font-medium text-primary-800">Why we need your phone number:</p>
        <p className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          Verified profiles get more trust from families
        </p>
        <p className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          Prevents fake accounts and scammers
        </p>
        <p className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Your number is validated but never shared publicly
        </p>
      </div>
    </div>
  );
}
