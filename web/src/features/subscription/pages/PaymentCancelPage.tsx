import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function PaymentCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <XCircle className="h-10 w-10 text-muted-foreground" />
      </div>

      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
        Payment Cancelled
      </h1>
      <p className="mt-3 text-muted-foreground max-w-md">
        No worries — you can upgrade anytime. Your free account is still active.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" asChild>
          <Link to={ROUTES.PLANS}>Try Again</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to={ROUTES.DASHBOARD}>Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
