import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthVerify, useAuthStart } from '../hooks/useAuthMutation';
import { ROUTES } from '@/lib/constants/routes';
import { CONFIG } from '@/lib/constants/config';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { identifier?: string; type?: 'phone' | 'email' } | null;

  const [otp, setOtp] = useState<string[]>(Array(CONFIG.OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState<number>(() => {
    const stored = localStorage.getItem('otp_cooldown_until');
    if (stored) {
      const remaining = Math.ceil((Number(stored) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return CONFIG.OTP_RESEND_COOLDOWN_SECONDS;
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const authVerify = useAuthVerify();
  const authStart = useAuthStart();

  // Set initial cooldown expiry if not already stored
  useEffect(() => {
    const stored = localStorage.getItem('otp_cooldown_until');
    if (!stored || Number(stored) < Date.now()) {
      const expiryMs = Date.now() + CONFIG.OTP_RESEND_COOLDOWN_SECONDS * 1000;
      localStorage.setItem('otp_cooldown_until', String(expiryMs));
    }
  }, []);

  // Redirect if no identifier
  useEffect(() => {
    if (!state?.identifier) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [state, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      setError('');

      // Auto-advance to next input
      if (value && index < CONFIG.OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits filled
      if (newOtp.every((d) => d !== '') && value) {
        submitOtp(newOtp.join(''));
      }
    },
    [otp],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CONFIG.OTP_LENGTH);
    if (pasted.length === CONFIG.OTP_LENGTH) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[CONFIG.OTP_LENGTH - 1]?.focus();
      submitOtp(pasted);
    }
  }, []);

  const submitOtp = async (otpString: string) => {
    if (!state?.identifier) return;
    setError('');

    try {
      const payload =
        state.type === 'phone'
          ? { phone: state.identifier, otp: otpString }
          : { email: state.identifier, otp: otpString };

      await authVerify.mutateAsync(payload);
      localStorage.removeItem('otp_cooldown_until');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setOtp(Array(CONFIG.OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !state?.identifier) return;
    setError('');

    try {
      const payload =
        state.type === 'phone'
          ? { phone: state.identifier }
          : { email: state.identifier };

      await authStart.mutateAsync(payload);
      const expiryMs = Date.now() + CONFIG.OTP_RESEND_COOLDOWN_SECONDS * 1000;
      localStorage.setItem('otp_cooldown_until', String(expiryMs));
      setCooldown(CONFIG.OTP_RESEND_COOLDOWN_SECONDS);
      setOtp(Array(CONFIG.OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(message);
    }
  };

  const maskedIdentifier = state?.identifier
    ? state.type === 'phone'
      ? `${state.identifier.slice(0, 4)}****${state.identifier.slice(-3)}`
      : `${state.identifier.slice(0, 3)}***@${state.identifier.split('@')[1]}`
    : '';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-10">
          <motion.div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-soft"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </motion.div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Verification Code
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-foreground">{maskedIdentifier}</span>
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2.5 sm:gap-3 mb-8" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoFocus={index === 0}
              aria-label={`OTP digit ${index + 1} of ${CONFIG.OTP_LENGTH}`}
              className={`h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-2 text-center text-xl sm:text-2xl font-bold font-heading transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                error
                  ? 'border-destructive focus:ring-destructive'
                  : digit
                    ? 'border-primary-700 bg-primary-50 focus:ring-primary-700'
                    : 'border-input focus:ring-ring hover:border-primary-300'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.p
            className="text-sm text-destructive mb-4"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        {/* Loading */}
        {authVerify.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}

        {/* Resend */}
        <div className="mb-8">
          {cooldown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{' '}
              <span className="font-medium text-foreground">{cooldown}s</span>
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={authStart.isPending}
              className="text-primary-700"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Resend Code
            </Button>
          )}
        </div>

        {/* Back */}
        <Button variant="ghost" onClick={() => navigate(ROUTES.LOGIN)} className="text-muted-foreground">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Change {state?.type === 'phone' ? 'phone number' : 'email'}
        </Button>
      </motion.div>
    </div>
  );
}
