import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-50 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
        <Heart className="h-10 w-10 text-primary-400" />
      </div>
      <h1 className="font-heading text-display-sm font-bold text-foreground">Page Not Found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you are looking for does not exist. Let us help you find your way back.
      </p>
      <Button className="mt-8" size="lg" asChild>
        <Link to={ROUTES.HOME}>Go Home</Link>
      </Button>
    </div>
  );
}
