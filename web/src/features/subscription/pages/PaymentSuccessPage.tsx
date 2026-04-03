import { Link } from 'react-router-dom';
import { CheckCircle2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          Payment Successful!
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md">
          Your subscription is now active. Enjoy premium features and find your perfect match.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 bg-accent-50 text-accent-700 px-4 py-2 rounded-full text-sm font-medium">
          <Crown className="h-4 w-4" />
          Premium member
        </div>

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
