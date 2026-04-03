import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

export default function PlaceholderPage() {
  const location = useLocation();

  return (
    <div className="py-16">
      <EmptyState
        icon={<Construction className="h-8 w-8" />}
        title="Coming Soon"
        description={`The page "${location.pathname}" is being built. Check back soon.`}
      />
    </div>
  );
}
