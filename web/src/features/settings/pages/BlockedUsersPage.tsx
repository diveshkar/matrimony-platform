import { ArrowLeft, UserX, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { ROUTES } from '@/lib/constants/routes';
import { formatRelativeTime } from '@/lib/utils/format';
import { useBlockedUsers, useUnblockUser } from '../hooks/useSettings';

export default function BlockedUsersPage() {
  const { data: response, isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();
  const blocked = response?.success ? response.data.items : [];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to={ROUTES.SETTINGS}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      <PageHeader title="Blocked Users" description={`${blocked.length} blocked`} />

      {blocked.length === 0 ? (
        <EmptyState
          icon={<UserX className="h-8 w-8" />}
          title="No blocked users"
          description="Users you block will appear here."
        />
      ) : (
        <div className="space-y-2">
          {blocked.map((item) => (
            <Card key={item.blockedUserId} className="border-0 shadow-soft-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.blockedUserId}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unblock.mutate(item.blockedUserId)}
                  disabled={unblock.isPending}
                  className="gap-1.5"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Unblock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
