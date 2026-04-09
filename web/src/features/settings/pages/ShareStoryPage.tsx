import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Send, Loader2, Trash2, CheckCircle2, Clock, XCircle, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiClient, type ApiResponse } from '@/lib/api/client';
import { useToast } from '@/components/ui/toaster';
import { ROUTES } from '@/lib/constants/routes';

interface Match {
  userId: string;
  name: string;
  photoUrl?: string;
}

interface MyStory {
  storyId: string;
  names: string;
  story: string;
  status: 'pending_approval' | 'approved' | 'declined';
  createdAt: string;
}

export default function ShareStoryPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [storyText, setStoryText] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: storyRes, isLoading: storyLoading } = useQuery({
    queryKey: ['my-story'],
    queryFn: () => apiClient.get<ApiResponse<{ story: MyStory | null }>>('/my-story').then(r => r.data),
  });

  const { data: matchesRes, isLoading: matchesLoading } = useQuery({
    queryKey: ['my-story-matches'],
    queryFn: () => apiClient.get<ApiResponse<{ matches: Match[] }>>('/my-story/matches').then(r => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (data: { partnerId: string; story: string }) =>
      apiClient.post<ApiResponse<{ status: string }>>('/my-story', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-story'] });
      toast.success('Story submitted!', 'Your partner will be notified for approval');
      setStoryText('');
      setSelectedMatch(null);
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to submit';
      toast.error('Submission failed', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete<ApiResponse<{ status: string }>>('/my-story').then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-story'] });
      setDeleteOpen(false);
      toast.info('Story deleted');
    },
  });

  const myStory = storyRes?.success ? storyRes.data.story : null;
  const matches = matchesRes?.success ? matchesRes.data.matches : [];

  if (storyLoading || matchesLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl" asChild>
          <Link to={ROUTES.SETTINGS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Share Your Story</h1>
          <p className="text-xs text-muted-foreground">Inspire others with your love story</p>
        </div>
      </div>

      {/* Already submitted */}
      {myStory && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-soft rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                {myStory.status === 'approved' && (
                  <Badge variant="success" className="text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Live on Platform
                  </Badge>
                )}
                {myStory.status === 'pending_approval' && (
                  <Badge variant="warning" className="text-[10px]">
                    <Clock className="mr-1 h-3 w-3" /> Waiting for Partner Approval
                  </Badge>
                )}
                {myStory.status === 'declined' && (
                  <Badge variant="destructive" className="text-[10px]">
                    <XCircle className="mr-1 h-3 w-3" /> Partner Declined
                  </Badge>
                )}
              </div>
              <h3 className="font-heading font-semibold">{myStory.names}</h3>
            </div>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                &ldquo;{myStory.story}&rdquo;
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Story
              </Button>
            </CardContent>
          </Card>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Delete Your Story?</DialogTitle>
                <DialogDescription className="text-center">
                  This will remove your story from the platform. You can submit a new one later.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteOpen(false)}>Keep</Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}

      {/* No story yet — submission form */}
      {!myStory && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* No matches */}
          {matches.length === 0 && (
            <Card className="border-0 shadow-soft rounded-2xl">
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
                  <Heart className="h-7 w-7 text-primary-300" />
                </div>
                <h3 className="font-heading text-lg font-semibold">No Matches Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  You need at least one accepted match to share a success story. Start discovering profiles and send interests!
                </p>
                <Button className="mt-6 rounded-xl" asChild>
                  <Link to={ROUTES.DISCOVER}>
                    <Heart className="mr-2 h-4 w-4" />
                    Discover Matches
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Has matches — show form */}
          {matches.length > 0 && (
            <>
              {/* Select partner */}
              <Card className="border-0 shadow-soft rounded-2xl">
                <CardContent className="p-5">
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Who is your story with? <span className="text-destructive">*</span>
                  </label>
                  <div className="space-y-2">
                    {matches.map((match) => (
                      <button
                        key={match.userId}
                        onClick={() => setSelectedMatch(match)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedMatch?.userId === match.userId
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-input hover:border-primary-300'
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-primary-50 shrink-0">
                          {match.photoUrl ? (
                            <img src={match.photoUrl} alt={match.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-300" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">{match.name}</span>
                        {selectedMatch?.userId === match.userId && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-primary-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Write story */}
              <Card className="border-0 shadow-soft rounded-2xl">
                <CardContent className="p-5">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Your Love Story <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Share how you met, what made your connection special, and your journey together.
                  </p>
                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="We first connected on Matrimony when..."
                    rows={6}
                    maxLength={2000}
                    className="flex w-full rounded-xl border border-input bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring hover:border-primary-300 transition-colors"
                  />
                  <p className="mt-1 text-xs text-muted-foreground text-right">
                    {storyText.length} / 2000
                  </p>
                </CardContent>
              </Card>

              {/* Info + submit */}
              <div className="bg-primary-50/50 rounded-xl p-4 text-xs text-primary-700 space-y-1.5">
                <p className="font-medium text-primary-800">How it works:</p>
                <p>1. You write and submit your story</p>
                <p>2. {selectedMatch ? selectedMatch.name : 'Your partner'} gets a notification to review it</p>
                <p>3. Once they approve, your story goes live on the landing page</p>
                <p>4. Either of you can remove the story at any time</p>
              </div>

              <Button
                className="w-full rounded-xl h-11"
                disabled={!selectedMatch || storyText.trim().length < 20 || submitMutation.isPending}
                onClick={() => {
                  if (selectedMatch) {
                    submitMutation.mutate({ partnerId: selectedMatch.userId, story: storyText });
                  }
                }}
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Submit for Partner Approval</>
                )}
              </Button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
