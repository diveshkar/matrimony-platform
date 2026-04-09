import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, CheckCircle2, XCircle, Loader2, Quote } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, type ApiResponse } from '@/lib/api/client';
import { useToast } from '@/components/ui/toaster';
import { ROUTES } from '@/lib/constants/routes';

export default function ApproveStoryPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ['my-story'],
    queryFn: () => apiClient.get<ApiResponse<{ story: Record<string, unknown> | null }>>('/my-story').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (action: 'approve' | 'decline') =>
      apiClient.post<ApiResponse<{ status: string }>>('/my-story/approve', { storyId, action }).then(r => r.data),
    onSuccess: (_data, action) => {
      queryClient.invalidateQueries({ queryKey: ['my-story'] });
      queryClient.invalidateQueries({ queryKey: ['success-stories'] });
      if (action === 'approve') {
        toast.success('Story approved!', 'Your love story is now live on the platform');
      } else {
        toast.info('Story declined', 'Your partner has been notified');
      }
      navigate(ROUTES.SETTINGS);
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Action failed';
      toast.error('Failed', msg);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // Try to find the approval from notifications context — for now show the story from the submitter
  // The story details are in the notification action URL
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
          <h1 className="font-heading text-xl font-bold text-foreground">Approve Love Story</h1>
          <p className="text-xs text-muted-foreground">Your partner wants to share your story</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Story preview */}
        <Card className="border-0 shadow-soft-lg rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Heart className="h-7 w-7 text-accent-400 fill-accent-400" />
            </div>
            <h2 className="font-heading text-lg font-bold text-white">Your Love Story</h2>
            <p className="text-sm text-white/60 mt-1">This is how it will appear on the landing page</p>
          </div>

          <CardContent className="p-6">
            <Quote className="h-8 w-8 text-primary-200 mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              Story ID: {storyId}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Click the notification to see the full story, or use the buttons below to approve or decline.
            </p>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="bg-primary-50/50 rounded-xl p-4 text-xs text-primary-700 space-y-1.5">
          <p className="font-medium text-primary-800">What happens next:</p>
          <p><strong>Approve</strong> — Your story goes live on the landing page for everyone to see</p>
          <p><strong>Decline</strong> — The story is not published. Your partner will be notified.</p>
          <p>You can remove the story later at any time from Settings.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate('decline')}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><XCircle className="mr-2 h-4 w-4" /> Decline</>
            )}
          </Button>
          <Button
            className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate('approve')}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Publish</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
