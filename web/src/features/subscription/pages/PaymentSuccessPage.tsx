import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Crown, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { subscriptionApi } from '../api/subscription-api';
import { useToast } from '@/components/ui/toaster';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(false);
  const [planId, setPlanId] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!sessionId) return;

    subscriptionApi.verifySession(sessionId)
      .then((res) => {
        if (res.success) {
          setVerified(true);
          setPlanId(res.data.planId);
          toast.success('Subscription activated!', `You are now a ${res.data.planId} member`);
        }
      })
      .catch(() => {
        toast.error('Could not verify payment', 'Please contact support if you were charged');
      })
      .finally(() => setVerifying(false));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-700 mb-4" />
        <h2 className="font-heading text-xl font-semibold">Verifying your payment...</h2>
        <p className="mt-2 text-sm text-muted-foreground">This will only take a moment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${verified ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          {verified ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          ) : (
            <AlertCircle className="h-10 w-10 text-amber-600" />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {verified ? 'Payment Successful!' : 'Payment Processing'}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md">
          {verified
            ? 'Your subscription is now active. Enjoy premium features and find your perfect match.'
            : 'Your payment is being processed. If you were charged, your plan will be activated shortly.'}
        </p>

        {verified && planId && (
          <div className="mt-6 inline-flex items-center gap-2 bg-accent-50 text-accent-700 px-4 py-2 rounded-full text-sm font-medium">
            <Crown className="h-4 w-4" />
            {planId.charAt(0).toUpperCase() + planId.slice(1)} Member
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link to={ROUTES.DISCOVER}>Discover Matches</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to={ROUTES.DASHBOARD}>Go to Dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
