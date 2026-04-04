import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { UpgradePrompt } from '@/features/subscription/components/UpgradePrompt';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import { useMessages, useSendMessage, useConversations } from '../hooks/useChat';
import type { MessageItem } from '../api/chat-api';

export default function ChatDetailPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [chatBlocked, setChatBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: msgResponse, isLoading: msgsLoading } = useMessages(conversationId);
  const { data: convsResponse } = useConversations();
  const sendMessage = useSendMessage(conversationId || '');

  const messages = msgResponse?.success ? msgResponse.data.items : [];

  const conversations = convsResponse?.success ? convsResponse.data.items : [];
  const currentConv = conversations.find((c) => c.conversationId === conversationId);
  const otherName = currentConv?.otherUserName || 'Chat';
  const otherPhoto = currentConv?.otherUserPhoto;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || sendMessage.isPending) return;

    const content = newMessage.trim();
    setNewMessage('');
    inputRef.current?.focus();

    try {
      await sendMessage.mutateAsync(content);
    } catch (err) {
      setNewMessage(content);
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 403) {
        setChatBlocked(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages = groupByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-5rem)] max-w-2xl mx-auto -my-6 sm:-my-8">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 px-1 border-b shrink-0 bg-white/80 backdrop-blur-sm">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl" asChild>
          <Link to={ROUTES.CHATS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="h-10 w-10 rounded-xl overflow-hidden bg-primary-50 shrink-0">
          {otherPhoto ? (
            <img src={otherPhoto} alt={otherName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-heading font-semibold text-sm truncate">{otherName}</h2>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-[10px] text-emerald-600 font-medium">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide">
        {msgsLoading && (
          <div className="space-y-3 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {!msgsLoading && messages.length === 0 && (
          <EmptyState
            title="No messages yet"
            description="Say hello to start the conversation!"
            className="py-8"
          />
        )}

        {groupedMessages.map(({ date, items }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {date}
              </span>
            </div>

            {/* Messages */}
            {items.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.messageId}
                  className={cn('flex mb-2 px-2', isMine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-3 text-sm leading-relaxed shadow-soft-sm',
                      isMine
                        ? 'bg-gradient-to-br from-primary-800 to-primary-900 text-white rounded-2xl rounded-br-md'
                        : 'bg-white text-foreground rounded-2xl rounded-bl-md',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={cn(
                        'text-[9px] mt-1',
                        isMine ? 'text-white/50 text-right' : 'text-muted-foreground',
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input or Upgrade Prompt */}
      {chatBlocked ? (
        <div className="border-t py-3 shrink-0">
          <UpgradePrompt
            title="Upgrade to chat"
            description="Chat is available on Silver plan and above."
          />
        </div>
      ) : (
        <div className="border-t py-3 shrink-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={2000}
              autoFocus
              disabled={sendMessage.isPending}
              className="flex-1 h-12 rounded-2xl border border-input bg-white px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 disabled:opacity-50 shadow-soft-sm"
            />
            <Button
              size="icon"
              className="h-12 w-12 rounded-2xl shrink-0 shadow-soft-sm"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function groupByDate(messages: MessageItem[]): { date: string; items: MessageItem[] }[] {
  const groups: Record<string, MessageItem[]> = {};

  for (const msg of messages) {
    const date = formatDate(msg.createdAt, 'DD MMM YYYY');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  }

  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}
