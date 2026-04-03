import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuthStart } from '../hooks/useAuthMutation';
import { ROUTES } from '@/lib/constants/routes';
import { CONFIG } from '@/lib/constants/config';

type AuthMode = 'phone' | 'email';

const countryCodes = [
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+94', country: 'LK', flag: '🇱🇰' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
];

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('phone');
  const [countryCode, setCountryCode] = useState('+44');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const authStart = useAuthStart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'phone') {
        if (!phoneNumber || phoneNumber.length < 6) {
          setError('Please enter a valid phone number');
          return;
        }
        const fullPhone = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
        await authStart.mutateAsync({ phone: fullPhone });
        navigate(ROUTES.VERIFY_OTP, { state: { identifier: fullPhone, type: 'phone' } });
      } else {
        if (!email || !email.includes('@')) {
          setError('Please enter a valid email address');
          return;
        }
        await authStart.mutateAsync({ email });
        navigate(ROUTES.VERIFY_OTP, { state: { identifier: email, type: 'email' } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Heart className="h-7 w-7 fill-accent-400 text-accent-400" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Welcome to {CONFIG.APP_NAME}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in or create an account to find your match
          </p>
        </div>

        <Card className="border-0 shadow-soft-lg">
          <CardContent className="pt-8 pb-8">
            {/* Mode toggle */}
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode('phone'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                  mode === 'phone'
                    ? 'bg-white text-foreground shadow-soft-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Phone className="h-4 w-4" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => { setMode('email'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                  mode === 'email'
                    ? 'bg-white text-foreground shadow-soft-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'phone' ? (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="flex h-11 rounded-lg border border-input bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-[110px]"
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
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      error={!!error}
                      className="flex-1"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!error}
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <motion.p
                  className="text-sm text-destructive"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full group"
                disabled={authStart.isPending}
              >
                {authStart.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                We will send you a one-time verification code
              </p>
            </div>

            <Separator className="my-6" />

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link to={ROUTES.TERMS} className="text-primary-700 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to={ROUTES.PRIVACY} className="text-primary-700 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
