import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { profileDetailPath } from '@/lib/constants/routes';
import { useShortlist, useRemoveFromShortlist } from '../hooks/useInterests';

export default function ShortlistPage() {
  const { data: response, isLoading } = useShortlist();
  const remove = useRemoveFromShortlist();

  const items = response?.success ? response.data.items : [];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Shortlist"
        description={`${items.length} profile${items.length !== 1 ? 's' : ''} saved`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title="No saved profiles"
          description="When you shortlist a profile, it will appear here for easy access."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.targetUserId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-0 shadow-soft hover-lift">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Link to={profileDetailPath(item.targetUserId)}>
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-primary-50 shrink-0">
                        {item.targetPhoto ? (
                          <img src={item.targetPhoto} alt={item.targetName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <User className="h-8 w-8 text-primary-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={profileDetailPath(item.targetUserId)} className="hover:underline">
                        <h3 className="font-heading font-semibold text-sm truncate">
                          {item.targetName || 'Unknown'}
                        </h3>
                      </Link>
                      {item.targetAge && (
                        <p className="text-xs text-muted-foreground">{item.targetAge} years</p>
                      )}
                      {(item.targetCity || item.targetCountry) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {item.targetCity ? `${item.targetCity}, ` : ''}{item.targetCountry}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(item.targetUserId)}
                      disabled={remove.isPending}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
