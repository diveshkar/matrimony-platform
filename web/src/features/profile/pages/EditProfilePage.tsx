import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, User, Heart, GraduationCap, MapPin, Users, MessageCircle, Pen, Phone, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DateOfBirthInput } from '@/components/common/DateOfBirthInput';
import { useMyProfile, useUpdateProfile } from '../hooks/useProfile';
import { useAuth } from '@/lib/auth/auth-context';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui/toaster';
import { ROUTES } from '@/lib/constants/routes';
import {
  RELIGION_OPTIONS,
  CASTE_OPTIONS,
  DENOMINATION_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  EDUCATION_OPTIONS,
  EDUCATION_FIELD_OPTIONS,
  OCCUPATION_OPTIONS,
  getIncomeOptions,
  COUNTRY_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  FAMILY_STATUS_OPTIONS,
  FAMILY_VALUES_OPTIONS,
  HEIGHT_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  GENDER_OPTIONS,
  RAASI_OPTIONS,
  NATCHATHIRAM_OPTIONS,
} from '@/lib/constants/enums';

const selectClass =
  'flex h-11 w-full rounded-xl border border-input bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-primary-300 transition-colors';

const countryCodes = [
  { code: '+44', flag: '🇬🇧' }, { code: '+94', flag: '🇱🇰' }, { code: '+91', flag: '🇮🇳' },
  { code: '+1', flag: '🇺🇸' }, { code: '+61', flag: '🇦🇺' }, { code: '+971', flag: '🇦🇪' },
  { code: '+49', flag: '🇩🇪' }, { code: '+33', flag: '🇫🇷' }, { code: '+65', flag: '🇸🇬' },
  { code: '+60', flag: '🇲🇾' }, { code: '+64', flag: '🇳🇿' },
];

export default function EditProfilePage() {
  const { data: response, isLoading, isError } = useMyProfile();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (response?.success) {
      const p = response.data.profile;
      setForm({ ...p });
    }
  }, [response]);

  const update = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const updates = { ...form };
      delete updates.PK;
      delete updates.SK;
      delete updates.userId;
      delete updates.schemaVersion;
      delete updates.createdAt;
      delete updates.updatedAt;
      delete updates.profileCompletion;
      await updateProfile.mutateAsync(updates);
      setHasChanges(false);
      toast.success('Profile saved', 'Your changes have been saved successfully');
    } catch {
      toast.error('Save failed', 'Could not save your changes. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 max-w-xl mx-auto">
        <p className="text-muted-foreground">Could not load your profile.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const casteOptions = form.religion ? CASTE_OPTIONS[form.religion as string] || [] : [];
  const incomeOptions = getIncomeOptions((form.country as string) || undefined);
  const denomOptions = form.religion ? DENOMINATION_OPTIONS[form.religion as string] || [] : [];

  return (
    <div className="max-w-xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl" asChild>
          <Link to={ROUTES.MY_PROFILE}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-heading text-xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <div className="space-y-5">
        {/* Basic Info */}
        <SectionCard icon={User} title="Basic Information" delay={0}>
          <Field label="Name">
            <Input value={(form.name as string) || ''} onChange={(e) => update('name', e.target.value)} className="h-11 rounded-xl" />
          </Field>
          <Field label="Date of Birth">
            <DateOfBirthInput value={(form.dateOfBirth as string) || ''} onChange={(val) => update('dateOfBirth', val)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gender">
              <select value={(form.gender as string) || ''} onChange={(e) => update('gender', e.target.value)} className={selectClass}>
                {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Height">
              <select value={String(form.height || '')} onChange={(e) => update('height', Number(e.target.value))} className={selectClass}>
                <option value="">Select</option>
                {HEIGHT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Marital Status">
            <select value={(form.maritalStatus as string) || ''} onChange={(e) => update('maritalStatus', e.target.value)} className={selectClass}>
              {MARITAL_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </SectionCard>

        {/* Phone Verification */}
        <SectionCard icon={Phone} title="Verified Phone Number" delay={0.05}>
          <EditPhoneSection currentPhone={user?.phone} onVerified={(phone) => update('phoneNumber', phone)} />
        </SectionCard>

        {/* Contact Info */}
        <SectionCard icon={MessageCircle} title="Contact Information" delay={0.1}>
          <p className="text-xs text-muted-foreground -mt-1 mb-2">Visible only to Gold and Platinum members.</p>
          {/* Rename back to "WhatsApp Number" when WhatsApp login is enabled */}
          <Field label="Phone Number">
            <Input value={(form.whatsappNumber as string) || ''} onChange={(e) => update('whatsappNumber', e.target.value)} placeholder="+447911123456" className="h-11 rounded-xl" />
          </Field>
          <Field label="Personal Email">
            <Input type="email" value={(form.personalEmail as string) || ''} onChange={(e) => update('personalEmail', e.target.value)} placeholder="your.email@example.com" className="h-11 rounded-xl" />
          </Field>
        </SectionCard>

        {/* Cultural */}
        <SectionCard icon={Heart} title="Cultural Background" delay={0.1}>
          <Field label="Religion">
            <select value={(form.religion as string) || ''} onChange={(e) => update('religion', e.target.value)} className={selectClass}>
              {RELIGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          {casteOptions.length > 0 && (
            <Field label="Caste">
              <select value={(form.caste as string) || ''} onChange={(e) => update('caste', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {casteOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          )}
          {denomOptions.length > 0 && (
            <Field label="Denomination">
              <select value={(form.denomination as string) || ''} onChange={(e) => update('denomination', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {denomOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          )}
          <Field label="Mother Tongue">
            <select value={(form.motherTongue as string) || ''} onChange={(e) => update('motherTongue', e.target.value)} className={selectClass}>
              {MOTHER_TONGUE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Raasi (Zodiac Sign)">
            <select value={(form.raasi as string) || ''} onChange={(e) => update('raasi', e.target.value)} className={selectClass}>
              <option value="">Select raasi</option>
              {RAASI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Natchathiram (Birth Star)">
            <select value={(form.natchathiram as string) || ''} onChange={(e) => update('natchathiram', e.target.value)} className={selectClass}>
              <option value="">Select natchathiram</option>
              {NATCHATHIRAM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </SectionCard>

        {/* Education & Career */}
        <SectionCard icon={GraduationCap} title="Education & Career" delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Education">
              <select value={(form.education as string) || ''} onChange={(e) => update('education', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Field of Study">
              <select value={(form.educationField as string) || ''} onChange={(e) => update('educationField', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {EDUCATION_FIELD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Occupation">
              <select value={(form.occupation as string) || ''} onChange={(e) => update('occupation', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {OCCUPATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Income">
              <select value={(form.incomeRange as string) || ''} onChange={(e) => update('incomeRange', e.target.value)} className={selectClass}>
                <option value="">Prefer not to say</option>
                {incomeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Employer">
            <Input value={(form.employer as string) || ''} onChange={(e) => update('employer', e.target.value)} placeholder="Company name" className="h-11 rounded-xl" />
          </Field>
        </SectionCard>

        {/* Location */}
        <SectionCard icon={MapPin} title="Location" delay={0.2}>
          <Field label="Country">
            <select value={(form.country as string) || ''} onChange={(e) => update('country', e.target.value)} className={selectClass}>
              <option value="">Select</option>
              {COUNTRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="State / Province">
              <Input value={(form.state as string) || ''} onChange={(e) => update('state', e.target.value)} className="h-11 rounded-xl" />
            </Field>
            <Field label="City">
              <Input value={(form.city as string) || ''} onChange={(e) => update('city', e.target.value)} className="h-11 rounded-xl" />
            </Field>
          </div>
        </SectionCard>

        {/* Family */}
        <SectionCard icon={Users} title="Family" delay={0.25}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Father's Occupation">
              <Input value={(form.fatherOccupation as string) || ''} onChange={(e) => update('fatherOccupation', e.target.value)} className="h-11 rounded-xl" />
            </Field>
            <Field label="Mother's Occupation">
              <Input value={(form.motherOccupation as string) || ''} onChange={(e) => update('motherOccupation', e.target.value)} className="h-11 rounded-xl" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Brothers">
              <Input type="number" min={0} max={15} value={(form.brothersCount as number) ?? ''} onChange={(e) => update('brothersCount', Number(e.target.value))} className="h-11 rounded-xl" />
            </Field>
            <Field label="Sisters">
              <Input type="number" min={0} max={15} value={(form.sistersCount as number) ?? ''} onChange={(e) => update('sistersCount', Number(e.target.value))} className="h-11 rounded-xl" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Family Type">
              <select value={(form.familyType as string) || ''} onChange={(e) => update('familyType', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {FAMILY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Family Status">
              <select value={(form.familyStatus as string) || ''} onChange={(e) => update('familyStatus', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {FAMILY_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Family Values">
            <select value={(form.familyValues as string) || ''} onChange={(e) => update('familyValues', e.target.value)} className={selectClass}>
              <option value="">Select</option>
              {FAMILY_VALUES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </SectionCard>

        {/* About Me */}
        <SectionCard icon={Pen} title="About Me" delay={0.3}>
          <textarea
            value={(form.aboutMe as string) || ''}
            onChange={(e) => update('aboutMe', e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Tell others about yourself, your interests, and what you're looking for..."
            className="flex w-full rounded-xl border border-input bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring hover:border-primary-300 transition-colors"
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {((form.aboutMe as string) || '').length} / 2000
          </p>
        </SectionCard>
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 backdrop-blur-md shadow-soft-xl px-4 py-3"
        >
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unsaved changes</p>
            <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-xl">
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function EditPhoneSection({ currentPhone, onVerified }: { currentPhone?: string; onVerified: (phone: string) => void }) {
  const [mode, setMode] = useState<'view' | 'enter' | 'verify' | 'done'>('view');
  const [cc, setCc] = useState('+44');
  const [num, setNum] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const fullPhone = `${cc}${num.replace(/\s/g, '')}`;

  const handleSend = async () => {
    if (num.length < 6) { setError('Enter a valid phone number'); return; }
    setError(''); setSending(true);
    try {
      await apiClient.post('/me/validate-phone', { phoneNumber: fullPhone, action: 'send-otp' });
      setMode('verify'); setCooldown(60); setOtp(Array(6).fill(''));
      setTimeout(() => refs.current[0]?.focus(), 100);
    } catch (err) {
      setError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed');
    } finally { setSending(false); }
  };

  const handleVerify = async (code: string) => {
    setError(''); setVerifying(true);
    try {
      await apiClient.post('/me/validate-phone', { phoneNumber: fullPhone, action: 'verify-otp', otp: code });
      setMode('done'); onVerified(fullPhone);
    } catch (err) {
      setError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Invalid code');
      setOtp(Array(6).fill('')); refs.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  if (mode === 'done') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">{fullPhone}</p>
          <p className="text-[10px] text-emerald-600">Newly verified</p>
        </div>
        <Badge variant="success" className="text-[9px]"><Shield className="mr-0.5 h-2.5 w-2.5" />Verified</Badge>
      </div>
    );
  }

  if (mode === 'verify') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{fullPhone.slice(0, 4)}●●●●{fullPhone.slice(-3)}</span>
        </p>
        <div className="flex justify-center gap-2">
          {otp.map((d, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={(e) => {
                if (!/^\d*$/.test(e.target.value)) return;
                const n = [...otp]; n[i] = e.target.value.slice(-1); setOtp(n); setError('');
                if (e.target.value && i < 5) refs.current[i + 1]?.focus();
                if (n.every(x => x) && e.target.value) handleVerify(n.join(''));
              }}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus(); }}
              className={`h-12 w-10 rounded-xl border-2 text-center text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${error ? 'border-destructive' : d ? 'border-primary-700 bg-primary-50' : 'border-input hover:border-primary-300'}`}
            />
          ))}
        </div>
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        {verifying && <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Verifying...</p>}
        <div className="text-center">
          {cooldown > 0 ? <p className="text-xs text-muted-foreground">Resend in {cooldown}s</p> :
            <button onClick={handleSend} disabled={sending} className="text-xs text-primary-700 underline">Resend Code</button>}
        </div>
        <button onClick={() => { setMode('enter'); setError(''); }} className="text-xs text-muted-foreground underline w-full text-center">Change number</button>
      </div>
    );
  }

  if (mode === 'enter') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">New Phone Number</label>
          <div className="flex gap-2">
            <select value={cc} onChange={(e) => setCc(e.target.value)} className="flex h-11 rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-[100px]">
              {countryCodes.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <Input type="tel" placeholder="7911 123456" value={num} onChange={(e) => { setNum(e.target.value); setError(''); }} error={!!error} className="flex-1 h-11 rounded-xl" />
          </div>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <Button className="w-full rounded-xl" onClick={handleSend} disabled={sending || num.length < 6}>
          {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Phone className="mr-2 h-4 w-4" />Send Verification Code</>}
        </Button>
        <button onClick={() => setMode('view')} className="text-xs text-muted-foreground underline w-full text-center">Cancel</button>
      </div>
    );
  }

  // mode === 'view'
  return (
    <div className="space-y-3">
      {currentPhone ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">{currentPhone}</p>
            <p className="text-[10px] text-emerald-600">Verified</p>
          </div>
          <Badge variant="success" className="text-[9px]"><Shield className="mr-0.5 h-2.5 w-2.5" />Verified</Badge>
        </div>
      ) : null}
      <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setMode('enter')}>
        {currentPhone ? 'Change Phone Number' : 'Add Phone Number'}
      </Button>
    </div>
  );
}

function SectionCard({ icon: Icon, title, delay = 0, children }: { icon: React.ElementType; title: string; delay?: number; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-0 shadow-soft rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
              <Icon className="h-4 w-4 text-primary-700" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
