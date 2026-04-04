import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Send, Check, X, MessageCircle, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';
import { profileDetailPath, ROUTES } from '@/lib/constants/routes';
import { useInbox, useOutbox, useRespondInterest } from '../hooks/useInterests';
import type { InterestItem } from '../api/interest-api';

type Tab = 'inbox' | 'outbox';

export default function InterestsPage() {
  const [tab, setTab] = useState<Tab>('inbox');
  const inbox = useInbox();
  const outbox = useOutbox();
  const respond = useRespondInterest();

  const isLoading = tab === 'inbox' ? inbox.isLoading : outbox.isLoading;
  const items =
    tab === 'inbox'
      ? inbox.data?.success
        ? inbox.data.data.items
        : []
      : outbox.data?.success
        ? outbox.data.data.items
        : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Interests</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your sent and received interests</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted/70 p-1.5">
        <button
          onClick={() => setTab('inbox')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all',
            tab === 'inbox'
              ? 'bg-white text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Heart className="h-4 w-4" />
          Received
          {inbox.data?.success &&
            inbox.data.data.items.filter((i) => i.status === 'pending').length > 0 && (
              <Badge variant="default" className="h-5 min-w-[20px] p-0 justify-center text-[10px]">
                {inbox.data.data.items.filter((i) => i.status === 'pending').length}
              </Badge>
            )}
        </button>
        <button
          onClick={() => setTab('outbox')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all',
            tab === 'outbox'
              ? 'bg-white text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Send className="h-4 w-4" />
          Sent
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && (tab === 'inbox' ? inbox.isError : outbox.isError) && (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="Could not load interests"
          description="Please try again."
          action={
            <Button onClick={() => (tab === 'inbox' ? inbox.refetch() : outbox.refetch())}>
              Retry
            </Button>
          }
        />
      )}

      {/* Empty */}
      {!isLoading && !inbox.isError && !outbox.isError && items.length === 0 && (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title={tab === 'inbox' ? 'No interests received yet' : 'No interests sent yet'}
          description={
            tab === 'inbox'
              ? 'When someone is interested in your profile, it will appear here.'
              : 'Browse profiles and send interests to people you like.'
          }
          action={
            <Button asChild>
              <Link to={ROUTES.DISCOVER}>
                {tab === 'inbox' ? 'Complete Your Profile' : 'Browse Profiles'}
              </Link>
            </Button>
          }
        />
      )}

      {/* List */}
      {!isLoading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <InterestCard
              key={`${item.senderId}-${item.receiverId}`}
              item={item}
              type={tab}
              onAccept={() => respond.mutate({ senderId: item.senderId, action: 'accept' })}
              onDecline={() => respond.mutate({ senderId: item.senderId, action: 'decline' })}
              isResponding={respond.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InterestCard({
  item,
  type,
  onAccept,
  onDecline,
  isResponding,
}: {
  item: InterestItem;
  type: Tab;
  onAccept: () => void;
  onDecline: () => void;
  isResponding: boolean;
}) {
  const isInbox = type === 'inbox';
  const name = isInbox ? item.senderName : item.receiverName;
  const photo = isInbox ? item.senderPhoto : item.receiverPhoto;
  const profileId = isInbox ? item.senderId : item.receiverId;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-soft-sm hover:shadow-soft transition-shadow rounded-xl">
        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
          {/* Avatar */}
          <Link to={profileDetailPath(profileId)}>
            <div className="h-14 w-14 rounded-2xl overflow-hidden bg-primary-50 shrink-0">
              {photo ? (
                <img src={photo} alt={name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-7 w-7 text-primary-300" />
                </div>
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link to={profileDetailPath(profileId)} className="hover:underline">
              <h3 className="font-heading font-semibold text-sm truncate">{name || 'Unknown'}</h3>
            </Link>
            {item.message && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                &ldquo;{item.message}&rdquo;
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={item.status} />
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isInbox && item.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={onAccept}
                  disabled={isResponding}
                  className="gap-1 text-xs"
                >
                  {isResponding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDecline}
                  disabled={isResponding}
                  className="gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
            {item.status === 'accepted' && (
              <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                <Link to={ROUTES.CHATS}>
                  <MessageCircle className="h-3 w-3" />
                  Chat
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending')
    return (
      <Badge variant="warning" className="text-[10px]">
        Pending
      </Badge>
    );
  if (status === 'accepted')
    return (
      <Badge variant="success" className="text-[10px]">
        Accepted
      </Badge>
    );
  if (status === 'declined')
    return (
      <Badge variant="destructive" className="text-[10px]">
        Declined
      </Badge>
    );
  return null;
}
