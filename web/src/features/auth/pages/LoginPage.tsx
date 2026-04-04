import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Phone, Mail, Heart, ArrowRight, Loader2, Shield, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuthStart } from '../hooks/useAuthMutation';
import { useAuth } from '@/lib/auth/auth-context';
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

const trustSignals = [
  { icon: Shield, text: 'Verified profiles' },
  { icon: Users, text: '15,000+ members' },
  { icon: Sparkles, text: 'Smart matching' },
];

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('phone');
  const [countryCode, setCountryCode] = useState('+44');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const authStart = useAuthStart();

  useEffect(() => {
    localStorage.removeItem('matrimony_onboarding_draft');
    localStorage.removeItem('otp_cooldown_until');
    if (isAuthenticated) {
      localStorage.removeItem('matrimony_access_token');
      localStorage.removeItem('matrimony_refresh_token');
      localStorage.removeItem('matrimony_user');
      queryClient.clear();
      logout();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="min-h-[85vh] flex">
      {/* Left side — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-accent-400/10 blur-[120px]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full bg-primary-400/10 blur-[120px]"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Heart className="h-6 w-6 fill-accent-400 text-accent-400" />
              </div>
              <span className="font-heading text-2xl font-bold text-white">{CONFIG.APP_NAME}</span>
            </div>
            <h2 className="font-heading text-4xl xl:text-5xl font-bold text-white leading-tight">
              Find Your{' '}
              <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
                Perfect Match
              </span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-md leading-relaxed">
              Join the most trusted matrimony platform for the global Tamil community.
            </p>

            <div className="mt-10 space-y-4">
              {trustSignals.map((signal) => (
                <div key={signal.text} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <signal.icon className="h-5 w-5 text-accent-400" />
                  </div>
                  <span className="text-sm text-white/70">{signal.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile header */}
          <div className="text-center mb-8 lg:mb-10">
            <div className="lg:hidden mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <Heart className="h-7 w-7 fill-accent-400 text-accent-400" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              <span className="hidden lg:inline">Welcome back</span>
              <span className="lg:hidden">Welcome to {CONFIG.APP_NAME}</span>
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Sign in or create an account to find your match
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-muted/70 p-1.5 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('phone');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
                mode === 'phone'
                  ? 'bg-white text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('email');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
                mode === 'email'
                  ? 'bg-white text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'phone' ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
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
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    error={!!error}
                    className="flex-1 h-12 rounded-xl"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!error}
                  className="h-12 rounded-xl"
                  autoFocus
                />
              </div>
            )}

            {error && (
              <motion.p
                className="text-sm text-destructive bg-destructive/5 px-4 py-2.5 rounded-lg"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              size="xl"
              className="w-full group rounded-xl"
              disabled={authStart.isPending}
            >
              {authStart.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            We will send you a one-time verification code
          </p>

          <Separator className="my-6" />

          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            By continuing, you agree to our{' '}
            <Link to={ROUTES.TERMS} className="text-primary-700 hover:underline font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to={ROUTES.PRIVACY} className="text-primary-700 hover:underline font-medium">
              Privacy Policy
            </Link>
          </p>

          {/* Mobile trust signals */}
          <div className="lg:hidden mt-8 flex items-center justify-center gap-6">
            {trustSignals.map((signal) => (
              <div key={signal.text} className="flex items-center gap-1.5">
                <signal.icon className="h-3.5 w-3.5 text-primary-400" />
                <span className="text-[10px] text-muted-foreground">{signal.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
