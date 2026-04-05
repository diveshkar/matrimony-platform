import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
} from 'lucide-react';
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

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileApi.getProfile(id!),
    enabled: !!id,
  });

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

  const raw = response.data as Record<string, string | number | boolean | undefined>;
  const s = (key: string): string => String(raw[key] || '');
  const n = (key: string): number => Number(raw[key]) || 0;
  const age = raw.dateOfBirth ? calculateAge(s('dateOfBirth')) : null;

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
        <div className="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[2/1] relative bg-muted">
          {raw.primaryPhotoUrl ? (
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
          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              {s('name')}{age ? `, ${age}` : ''}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-white/70">
              {raw.height && <span>{formatHeight(n('height'))}</span>}
              {raw.city && (
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

      {/* Quick badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('religion'))}</Badge>
        {raw.caste && <Badge variant="outline" className="py-1 px-3 text-xs">{s('caste')}</Badge>}
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('education'))}</Badge>
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('maritalStatus'))}</Badge>
        <Badge variant="outline" className="py-1 px-3 text-xs">{formatEnum(s('motherTongue'))}</Badge>
      </div>

      {/* Contact Info */}
      <ContactInfoCard
        email={s('personalEmail') || s('email')}
        whatsapp={s('whatsappNumber')}
        canView={raw.contactInfoVisible === true}
      />

      {/* About */}
      {raw.aboutMe && (
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
          {raw.educationField && <InfoRow label="Field" value={s('educationField')} />}
          {raw.occupation && <InfoRow label="Occupation" value={s('occupation')} />}
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
          {raw.state && <InfoRow label="State" value={s('state')} />}
          {raw.city && <InfoRow label="City" value={s('city')} />}
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
          {raw.caste && <InfoRow label="Caste" value={s('caste')} />}
          <InfoRow label="Mother Tongue" value={formatEnum(s('motherTongue'))} />
        </CardContent>
      </Card>
      </div> {/* close grid */}

      {/* Family */}
      {(raw.fatherOccupation || raw.motherOccupation || raw.familyType) && (
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
            {raw.fatherOccupation && <InfoRow label="Father" value={s('fatherOccupation')} />}
            {raw.motherOccupation && <InfoRow label="Mother" value={s('motherOccupation')} />}
            {raw.familyType && <InfoRow label="Family Type" value={formatEnum(s('familyType'))} />}
            {raw.familyValues && (
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
