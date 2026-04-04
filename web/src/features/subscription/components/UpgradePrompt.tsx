import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

interface UpgradePromptProps {
  title?: string;
  description?: string;
}

export function UpgradePrompt({
  title = 'Upgrade to unlock this feature',
  description = 'Get more profile views, unlimited interests, and full chat access.',
}: UpgradePromptProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-6 text-center">
      <Crown className="h-8 w-8 text-accent-500 mx-auto mb-3" />
      <h3 className="font-heading font-semibold text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      <Button className="mt-4" asChild>
        <Link to={ROUTES.PLANS}>View Plans</Link>
      </Button>
    </div>
  );
}
