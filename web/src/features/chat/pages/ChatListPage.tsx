import { Link } from 'react-router-dom';
import { MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatRelativeTime } from '@/lib/utils/format';
import { chatDetailPath, ROUTES } from '@/lib/constants/routes';
import { useConversations } from '../hooks/useChat';

export default function ChatListPage() {
  const { data: response, isLoading, isError, refetch } = useConversations();

  const conversations = response?.success ? response.data.items : [];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="Messages" description="Your conversations" />

      {isError && (
        <EmptyState
          icon={<MessageCircle className="h-8 w-8" />}
          title="Could not load conversations"
          description="Please try again."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      )}

      {!isError && conversations.length === 0 && (
        <EmptyState
          icon={<MessageCircle className="h-8 w-8" />}
          title="No conversations yet"
          description="Accept an interest to start chatting with your matches."
          action={
            <Button asChild>
              <Link to={ROUTES.INTERESTS}>View Interests</Link>
            </Button>
          }
        />
      )}

      {conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.conversationId}
              to={chatDetailPath(conv.conversationId)}
              className="flex items-center gap-4 p-4 rounded-xl border bg-white hover:bg-warm-50 hover:shadow-soft transition-all shadow-soft-sm"
            >
              <div className="h-12 w-12 rounded-full overflow-hidden bg-primary-50 shrink-0">
                {conv.otherUserPhoto ? (
                  <img
                    src={conv.otherUserPhoto}
                    alt={conv.otherUserName}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className="font-heading font-semibold text-sm truncate"
                    title={conv.otherUserName}
                  >
                    {conv.otherUserName}
                  </h3>
                  {conv.lastMessageAt && (
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage || 'No messages yet'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge
                      variant="default"
                      className="h-5 min-w-[20px] p-0 justify-center text-[10px] ml-2 shrink-0"
                    >
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
