import { useState, useRef, useCallback, useEffect } from 'react';
import { Phone, CheckCircle2, Shield, Loader2, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { apiClient } from '@/lib/api/client';
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
  'United Kingdom': '+44', 'Sri Lanka': '+94', 'India': '+91',
  'United States': '+1', 'Canada': '+1', 'Australia': '+61',
  'UAE': '+971', 'Germany': '+49', 'France': '+33',
  'Singapore': '+65', 'Malaysia': '+60', 'New Zealand': '+64',
};

type PhoneStep = 'enter' | 'verify' | 'verified';

export function StepPhoneVerify({ data, onChange, errors }: StepProps) {
  const { user } = useAuth();
  const existingPhone = user?.phone;
  const hasPhoneFromLogin = !!existingPhone;

  const [step, setStep] = useState<PhoneStep>(hasPhoneFromLogin ? 'verified' : 'enter');
  const [countryCode, setCountryCode] = useState(() => {
    if (data.phoneNumber) {
      const match = countryCodes.find((cc) => data.phoneNumber?.startsWith(cc.code));
      return match?.code || '+44';
    }
    if (existingPhone) {
      const match = countryCodes.find((cc) => existingPhone.startsWith(cc.code));
      return match?.code || '+44';
    }
    if (data.country) return countryToCode[data.country] || '+44';
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
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill for WhatsApp login users
  useEffect(() => {
    if (hasPhoneFromLogin && !data.phoneNumber) {
      onChange({ phoneNumber: existingPhone });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const fullPhone = `${countryCode}${localNumber.replace(/\s/g, '')}`;

  const handleSendCode = async () => {
    if (localNumber.length < 6) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setSending(true);
    try {
      await apiClient.post('/me/validate-phone', {
        phoneNumber: fullPhone,
        action: 'send-otp',
      });
      setStep('verify');
      setCooldown(60);
      setOtp(Array(6).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to send code';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (otpString: string) => {
    setError('');
    setVerifying(true);
    try {
      await apiClient.post('/me/validate-phone', {
        phoneNumber: fullPhone,
        action: 'verify-otp',
        otp: otpString,
      });
      setStep('verified');
      onChange({ phoneNumber: fullPhone });
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Invalid code';
      setError(msg);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      setError('');

      if (value && index < 5) inputRefs.current[index + 1]?.focus();
      if (newOtp.every((d) => d !== '') && value) {
        handleVerifyCode(newOtp.join(''));
      }
    },
    [otp], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  // ── WhatsApp login user — already verified ──
  if (hasPhoneFromLogin) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-emerald-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-heading font-semibold text-emerald-800">Phone Already Verified</h3>
          <p className="mt-1 text-sm text-emerald-700">{existingPhone}</p>
          <Badge variant="success" className="mt-2 text-[10px]">Verified via WhatsApp Login</Badge>
        </div>
        <div className="bg-primary-50/50 rounded-xl p-4 text-xs text-primary-700 space-y-1.5">
          <p className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 shrink-0" />Your phone number is verified and linked to your account</p>
          <p className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 shrink-0" />This builds trust with other members and their families</p>
        </div>
      </div>
    );
  }

  // ── Step: Verified ──
  if (step === 'verified') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-emerald-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-heading font-semibold text-emerald-800">Phone Verified</h3>
          <p className="mt-1 text-sm text-emerald-700">{fullPhone}</p>
          <Badge variant="success" className="mt-2 text-[10px]">Verified via SMS</Badge>
        </div>
        <p className="text-xs text-center text-muted-foreground">Click Continue to proceed to the next step.</p>
      </div>
    );
  }

  // ── Step: Verify OTP ──
  if (step === 'verify') {
    const maskedPhone = `${fullPhone.slice(0, 4)}●●●●${fullPhone.slice(-3)}`;
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Phone className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="font-heading font-semibold">Enter Verification Code</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 6-digit code via SMS to <span className="font-medium text-foreground">{maskedPhone}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2.5">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              autoFocus={index === 0}
              className={`h-14 w-12 rounded-xl border-2 text-center text-xl font-bold font-heading transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                error
                  ? 'border-destructive focus:ring-destructive'
                  : digit
                    ? 'border-primary-700 bg-primary-50 focus:ring-primary-700'
                    : 'border-input focus:ring-ring hover:border-primary-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center bg-destructive/5 px-4 py-2 rounded-lg">{error}</p>
        )}

        {verifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />Verifying...
          </div>
        )}

        <div className="text-center">
          {cooldown > 0 ? (
            <p className="text-sm text-muted-foreground">Resend code in <span className="font-medium text-foreground">{cooldown}s</span></p>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleSendCode} disabled={sending} className="text-primary-700">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Resend Code
            </Button>
          )}
        </div>

        <button
          onClick={() => { setStep('enter'); setError(''); }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 w-full text-center"
        >
          Change phone number
        </button>
      </div>
    );
  }

  // ── Step: Enter Phone ──
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        We'll send a verification code via SMS to confirm you own this number. This builds trust with other members and their families.
      </p>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Mobile Phone Number <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="flex h-12 rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-[115px]"
          >
            {countryCodes.map((cc) => (
              <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
            ))}
          </select>
          <Input
            type="tel"
            placeholder="7911 123456"
            value={localNumber}
            onChange={(e) => { setLocalNumber(e.target.value); setError(''); }}
            error={!!error || !!errors.phoneNumber}
            className="flex-1 h-12 rounded-xl"
          />
        </div>
        {(error || errors.phoneNumber) && (
          <p className="text-xs text-destructive mt-1.5">{error || errors.phoneNumber}</p>
        )}
      </div>

      <Button
        className="w-full rounded-xl h-11"
        onClick={handleSendCode}
        disabled={sending || localNumber.length < 6}
      >
        {sending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validating & Sending...</>
        ) : (
          <><Phone className="mr-2 h-4 w-4" />Send Verification Code</>
        )}
      </Button>

      <div className="bg-primary-50/50 rounded-xl p-4 text-xs text-primary-700 space-y-1.5">
        <p className="font-medium text-primary-800">What happens:</p>
        <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />We verify your number is a real mobile</p>
        <p className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 shrink-0" />Send a 6-digit code via SMS</p>
        <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />You enter the code to prove ownership</p>
      </div>
    </div>
  );
}
