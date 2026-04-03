import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, Crown, CheckCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';
import { useNotifications, useMarkAllRead } from '../hooks/useSettings';

const typeIcons: Record<string, typeof Bell> = {
  interest_received: Heart,
  interest_accepted: Heart,
  new_message: MessageCircle,
  plan_purchased: Crown,
  welcome: User,
};

export default function NotificationsPage() {
  const { data: response, isLoading } = useNotifications();
  const markAll = useMarkAllRead();

  const notifications = response?.success ? response.data.items : [];
  const unreadCount = response?.success ? response.data.unreadCount : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="No notifications"
          description="You are all caught up! Notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Link key={notif.notificationId} to={notif.actionUrl || '#'}>
                <Card className={cn(
                  'border-0 transition-shadow',
                  notif.isRead ? 'shadow-soft-sm' : 'shadow-soft bg-primary-50/30 border-l-4 border-l-primary-700',
                )}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      notif.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary-100 text-primary-700',
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn('text-sm', !notif.isRead && 'font-semibold')}>{notif.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
