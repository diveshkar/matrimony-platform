import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, GraduationCap, Heart, Users, User, Calendar, Star, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { profileApi } from '@/features/profile/api/profile-api';
import { useSendInterest, useAddToShortlist } from '@/features/interests/hooks/useInterests';
import { formatHeight, calculateAge } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';

function formatEnum(str?: string): string {
  if (!str) return '-';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileApi.getProfile(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !response?.success) {
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

  const raw = response.data as Record<string, string | number | boolean | undefined>;
  const s = (key: string): string => String(raw[key] || '');
  const n = (key: string): number => Number(raw[key]) || 0;
  const age = raw.dateOfBirth ? calculateAge(s('dateOfBirth')) : null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link to={ROUTES.DISCOVER}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Discover
        </Link>
      </Button>

      {/* Hero photo */}
      <div className="aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden bg-muted relative">
        {raw.primaryPhotoUrl ? (
          <img
            src={s('primaryPhotoUrl')}
            alt={s('name')}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
            <User className="h-24 w-24 text-primary-200" />
          </div>
        )}
      </div>

      {/* Name + key info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {s('name')}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {age && <span>{age} years</span>}
            {raw.height && <span>{formatHeight(n('height'))}</span>}
            {raw.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {s('city')}, {s('country')}
              </span>
            )}
          </div>
        </div>

        <ProfileActions profileId={id!} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{formatEnum(s('religion'))}</Badge>
        {raw.caste && <Badge variant="outline">{s('caste')}</Badge>}
        <Badge variant="outline">{formatEnum(s('education'))}</Badge>
        <Badge variant="outline">{formatEnum(s('maritalStatus'))}</Badge>
        <Badge variant="outline">{formatEnum(s('motherTongue'))}</Badge>
      </div>

      {/* About */}
      {raw.aboutMe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary-700" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {s('aboutMe')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Education & Career */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-700" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-700" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Country" value={s('country')} />
          {raw.state && <InfoRow label="State" value={s('state')} />}
          {raw.city && <InfoRow label="City" value={s('city')} />}
        </CardContent>
      </Card>

      {/* Cultural */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-700" />
            Cultural Background
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Religion" value={formatEnum(s('religion'))} />
          {raw.caste && <InfoRow label="Caste" value={s('caste')} />}
          <InfoRow label="Mother Tongue" value={formatEnum(s('motherTongue'))} />
        </CardContent>
      </Card>

      {/* Family */}
      {(raw.fatherOccupation || raw.motherOccupation || raw.familyType) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-700" />
              Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {raw.fatherOccupation && <InfoRow label="Father" value={s('fatherOccupation')} />}
            {raw.motherOccupation && <InfoRow label="Mother" value={s('motherOccupation')} />}
            {raw.familyType && <InfoRow label="Family Type" value={formatEnum(s('familyType'))} />}
            {raw.familyValues && <InfoRow label="Family Values" value={formatEnum(s('familyValues'))} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileActions({ profileId }: { profileId: string }) {
  const sendInterest = useSendInterest();
  const addToShortlist = useAddToShortlist();

  return (
    <div className="flex gap-2">
      <Button
        className="gap-2"
        onClick={() => sendInterest.mutate({ receiverId: profileId })}
        disabled={sendInterest.isPending || sendInterest.isSuccess}
      >
        {sendInterest.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${sendInterest.isSuccess ? 'fill-current' : ''}`} />
        )}
        {sendInterest.isSuccess ? 'Interest Sent' : 'Send Interest'}
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => addToShortlist.mutate(profileId)}
        disabled={addToShortlist.isPending || addToShortlist.isSuccess}
      >
        <Star className={`h-4 w-4 ${addToShortlist.isSuccess ? 'fill-accent-400 text-accent-400' : ''}`} />
        {addToShortlist.isSuccess ? 'Saved' : 'Shortlist'}
      </Button>
    </div>
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
