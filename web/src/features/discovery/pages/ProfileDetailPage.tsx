import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Heart,
  Users,
  User,
  Calendar,
  Star,
  Loader2,
  Ban,
  Flag,
  Mail,
  MessageCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  Crown,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { profileApi } from '@/features/profile/api/profile-api';
import {
  useSendInterest,
  useAddToShortlist,
  useRespondInterest,
  useWithdrawInterest,
} from '@/features/interests/hooks/useInterests';
import { useBlockUser } from '@/features/settings/hooks/useSettings';
import { ReportDialog } from '@/features/settings/components/ReportDialog';
import { formatHeight, calculateAge } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';

function formatEnum(str?: string): string {
  if (!str) return '-';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileApi.getProfile(id!),
    enabled: !!id,
    retry: (failureCount, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) return false;
      return failureCount < 2;
    },
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (response?.success) {
      queryClient.invalidateQueries({ queryKey: ['usage'] });
    }
  }, [response?.success, queryClient]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    const is403 = status === 403;

    if (is403) {
      return (
        <div className="max-w-md mx-auto text-center py-16">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">Daily Limit Reached</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
            You've used all your profile views for today. Upgrade your plan to view more profiles.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to={ROUTES.DISCOVER}>Back to Discover</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.PLANS}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <EmptyState
        title="Profile not found"
        description="This profile may have been removed or is not available."
        action={
          <Button asChild>
            <Link to={ROUTES.DISCOVER}>Back to Discover</Link>
          </Button>
        }
      />
    );
  }

  if (!response?.success) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const raw = response.data as Record<string, unknown>;
  const s = (key: string): string => String(raw[key] || '');
  const n = (key: string): number => Number(raw[key]) || 0;
  const age = s('dateOfBirth') ? calculateAge(s('dateOfBirth')) : null;
  const photos = (raw.photos || []) as { photoId: string; url: string; isPrimary: boolean; locked: boolean }[];
  const totalPhotos = (raw.totalPhotos as number) || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
        <Link to={ROUTES.DISCOVER}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Hero photo card */}
      <Card className="overflow-hidden border-0 shadow-soft-lg">
        <div
          className="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[2/1] relative bg-muted cursor-pointer"
          onClick={() => photos.length > 0 && !photos[0]?.locked && setLightboxIndex(0)}
        >
          {s('primaryPhotoUrl') ? (
            <img
              src={s('primaryPhotoUrl')}
              alt={s('name')}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-warm-100">
              <User className="h-24 w-24 text-primary-200" />
            </div>
          )}
          {/* Verified badge */}
          {Boolean(raw.phoneVerified) && (
            <div className="absolute top-3 left-3">
              <Badge variant="success" className="text-xs backdrop-blur-sm bg-emerald-500/90 border-0 px-2.5 py-1">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Phone Verified
              </Badge>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              {s('name')}{age ? `, ${age}` : ''}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-white/70">
              {n('height') > 0 && <span>{formatHeight(n('height'))}</span>}
              {s('city') && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {s('city')}, {s('country')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action bar inside card */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-t bg-warm-50/50">
          <ProfileActions profileId={id!} interestStatus={s('interestStatus') || 'none'} />
        </div>
      </Card>

      {/* Photo Gallery */}
      {photos.length > 1 && (
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
                <Camera className="h-3.5 w-3.5 text-primary-700" />
              </div>
              Photos
              <span className="text-xs text-muted-foreground font-normal ml-1">
                {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo, i) => (
                <motion.button
                  key={photo.photoId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => !photo.locked && setLightboxIndex(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden group ${
                    photo.locked ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {photo.locked ? (
                    <div className="h-full w-full bg-gradient-to-br from-primary-100 via-warm-100 to-primary-50 flex flex-col items-center justify-center gap-1.5 p-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-soft">
                        <Lock className="h-4 w-4 text-primary-600" />
                      </div>
                      <span className="text-[9px] text-primary-700 font-medium text-center leading-tight">Upgrade to view</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={photo.url}
                        alt={`Photo ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </>
                  )}
                  {photo.isPrimary && !photo.locked && (
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="text-[8px] px-1.5 py-0 bg-white/90 text-primary-700 backdrop-blur-sm">
                        Primary
                      </Badge>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            {photos.some((p) => p.locked) && (
              <Link
                to={ROUTES.PLANS}
                className="flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 text-xs font-medium text-primary-700 hover:from-primary-100 hover:to-accent-100 transition-colors"
              >
                <Crown className="h-3.5 w-3.5" />
                Upgrade to see all {totalPhotos} photos
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photo Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0 overflow-hidden" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Photo viewer</DialogTitle>
          {lightboxIndex !== null && photos[lightboxIndex] && !photos[lightboxIndex].locked && (
            <div className="relative">
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={photos[lightboxIndex].url}
                  alt={`Photo ${lightboxIndex + 1}`}
                  className="w-full max-h-[80vh] object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              {/* Nav buttons */}
              {lightboxIndex > 0 && !photos[lightboxIndex - 1]?.locked && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {lightboxIndex < photos.length - 1 && !photos[lightboxIndex + 1]?.locked && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs">
                {lightboxIndex + 1} / {photos.filter((p) => !p.locked).length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('religion'))}</Badge>
        {s('caste') && <Badge variant="outline" className="py-1 px-3 text-xs">{s('caste')}</Badge>}
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('education'))}</Badge>
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('maritalStatus'))}</Badge>
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('motherTongue'))}</Badge>
      </div>

      {/* Contact Info */}
      <ContactInfoCard
        email={s('personalEmail') || s('email')}
        whatsapp={s('whatsappNumber')}
        canView={Boolean(raw.contactInfoVisible)}
      />

      {/* About */}
      {s('aboutMe') && (
        <Card className="border-0 shadow-soft">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
              &ldquo;{s('aboutMe')}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Education & Career */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
              <GraduationCap className="h-3.5 w-3.5 text-primary-700" />
            </div>
            Education & Career
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Education" value={formatEnum(s('education'))} />
          {s('educationField') &&<InfoRow label="Field" value={s('educationField')} />}
          {s('occupation') &&<InfoRow label="Occupation" value={s('occupation')} />}
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
              <MapPin className="h-3.5 w-3.5 text-primary-700" />
            </div>
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <InfoRow label="Country" value={s('country')} />
          {s('state') &&<InfoRow label="State" value={s('state')} />}
          {s('city') && <InfoRow label="City" value={s('city')} />}
        </CardContent>
      </Card>

      {/* Cultural */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
              <Calendar className="h-3.5 w-3.5 text-primary-700" />
            </div>
            Cultural
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <InfoRow label="Religion" value={formatEnum(s('religion'))} />
          {s('caste') && <InfoRow label="Caste" value={s('caste')} />}
          <InfoRow label="Mother Tongue" value={formatEnum(s('motherTongue'))} />
          {s('raasi') && <InfoRow label="Raasi" value={s('raasi')} />}
          {s('natchathiram') && <InfoRow label="Natchathiram" value={s('natchathiram')} />}
        </CardContent>
      </Card>
      </div> {/* close grid */}

      {/* Family */}
      {(s('fatherOccupation') || s('motherOccupation') || s('familyType')) && (
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
                <Users className="h-3.5 w-3.5 text-primary-700" />
              </div>
              Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s('fatherOccupation') &&<InfoRow label="Father" value={s('fatherOccupation')} />}
            {s('motherOccupation') &&<InfoRow label="Mother" value={s('motherOccupation')} />}
            {s('familyType') &&<InfoRow label="Family Type" value={formatEnum(s('familyType'))} />}
            {s('familyValues') && (
              <InfoRow label="Family Values" value={formatEnum(s('familyValues'))} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileActions({
  profileId,
  interestStatus,
}: {
  profileId: string;
  interestStatus: string;
}) {
  const sendInterest = useSendInterest();
  const respondInterest = useRespondInterest();
  const withdrawInterest = useWithdrawInterest();
  const addToShortlist = useAddToShortlist();
  const blockUser = useBlockUser();
  const [showReport, setShowReport] = useState(false);

  const effectiveStatus = withdrawInterest.isSuccess
    ? 'none'
    : sendInterest.isSuccess
      ? 'pending'
      : respondInterest.isSuccess
        ? 'accepted'
        : interestStatus;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Interest button based on status */}
        {effectiveStatus === 'none' && (
          <Button
            className="gap-2"
            onClick={() => sendInterest.mutate({ receiverId: profileId })}
            disabled={sendInterest.isPending}
          >
            {sendInterest.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            Send Interest
          </Button>
        )}

        {effectiveStatus === 'pending' && (
          <>
            <Button className="gap-2" variant="secondary" disabled>
              <Heart className="h-4 w-4 fill-current" />
              Interest Sent
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-xs"
              onClick={() => withdrawInterest.mutate(profileId)}
              disabled={withdrawInterest.isPending}
            >
              {withdrawInterest.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              Withdraw
            </Button>
          </>
        )}

        {effectiveStatus === 'accepted' && (
          <Button className="gap-2" variant="gold" asChild>
            <Link to={ROUTES.CHATS}>
              <MessageCircle className="h-4 w-4" />
              Chat Now
            </Link>
          </Button>
        )}

        {effectiveStatus === 'declined' && (
          <Button className="gap-2" variant="secondary" disabled>
            <Heart className="h-4 w-4 text-muted-foreground" />
            Interest Declined
          </Button>
        )}

        {effectiveStatus === 'received' && (
          <>
            <Button
              className="gap-2"
              onClick={() =>
                respondInterest.mutate({ senderId: profileId, action: 'accept' })
              }
              disabled={respondInterest.isPending}
            >
              {respondInterest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              Accept Interest
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                respondInterest.mutate({ senderId: profileId, action: 'decline' })
              }
              disabled={respondInterest.isPending}
            >
              Decline
            </Button>
          </>
        )}

        {/* Shortlist */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => addToShortlist.mutate(profileId)}
          disabled={addToShortlist.isPending || addToShortlist.isSuccess}
        >
          <Star
            className={`h-4 w-4 ${addToShortlist.isSuccess ? 'fill-accent-400 text-accent-400' : ''}`}
          />
          {addToShortlist.isSuccess ? 'Saved' : 'Shortlist'}
        </Button>

        {/* Block & Report */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => blockUser.mutate(profileId)}
          disabled={blockUser.isPending || blockUser.isSuccess}
          title="Block user"
        >
          <Ban className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowReport(true)} title="Report user">
          <Flag className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <ReportDialog open={showReport} onOpenChange={setShowReport} reportedUserId={profileId} />
    </>
  );
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '●●●●●●●●●';
  return phone.slice(0, 4) + '●●●●' + phone.slice(-3);
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '●●●@●●●.com';
  const [name, domain] = email.split('@');
  return name.slice(0, 2) + '●●●@' + domain;
}

function ContactInfoCard({
  email,
  whatsapp,
  canView,
}: {
  email: string;
  whatsapp: string;
  canView: boolean;
}) {
  const hasAny = email || whatsapp;
  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary-700" />
          Contact Information
          {!canView && (
            <Badge variant="outline" className="ml-auto text-[10px] font-normal">
              <Lock className="mr-1 h-3 w-3" />
              Gold+ only
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {email && (
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{canView ? email : maskEmail(email)}</span>
          </div>
        )}
        {whatsapp && (
          <div className="flex items-center gap-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{canView ? whatsapp : maskPhone(whatsapp)}</span>
            <span className="text-xs text-muted-foreground">WhatsApp</span>
          </div>
        )}
        {!canView && (
          <Link
            to={ROUTES.PLANS}
            className="flex items-center gap-2 mt-3 text-xs text-primary-700 hover:underline font-medium"
          >
            <Lock className="h-3 w-3" />
            Upgrade to Gold to see full contact details
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
