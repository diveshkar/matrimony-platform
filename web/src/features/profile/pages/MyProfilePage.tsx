import { Link } from 'react-router-dom';
import { Edit, MapPin, GraduationCap, Briefcase, Users, Heart, Calendar, Camera, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { useMyProfile } from '../hooks/useProfile';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { calculateAge, formatHeight } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';

export default function MyProfilePage() {
  const { data: response, isLoading, isError, refetch } = useMyProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !response?.success) {
    return (
      <EmptyState
        title="Could not load profile"
        description="Please try again later."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const { profile, preferences } = response.data;
  const { data: subResponse } = useMySubscription();
  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const isPremium = planId !== 'free';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="My Profile"
        description={`Matrimony ID: ${profile.userId?.slice(0, 12) || 'N/A'}`}
        action={
          <div className="flex items-center gap-2">
            {isPremium && (
              <Badge variant="gold" className="px-3 py-1">
                <Crown className="mr-1 h-3 w-3" />
                {planLabel}
              </Badge>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.SETTINGS}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        }
      />

      {/* Completion */}
      {profile.profileCompletion < 100 && (
        <Card className="border-primary-200 bg-primary-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Profile Completion</p>
              <span className="text-sm font-bold text-primary-800">{profile.profileCompletion}%</span>
            </div>
            <Progress value={profile.profileCompletion} />
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary-700" />
              Photos
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.MY_PHOTOS}>Manage Photos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.primaryPhotoUrl ? (
            <img
              src={profile.primaryPhotoUrl}
              alt="Primary photo"
              className="h-32 w-32 rounded-xl object-cover"
            />
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Camera className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="font-medium text-foreground">No photos yet</p>
                <p>Add photos to get 5x more interest</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary-700" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Name" value={profile.name} />
          <InfoRow label="Age" value={profile.dateOfBirth ? `${calculateAge(profile.dateOfBirth)} years` : '-'} />
          <InfoRow label="Height" value={profile.height ? formatHeight(profile.height) : '-'} />
          <InfoRow label="Gender" value={capitalize(profile.gender)} />
          <InfoRow label="Marital Status" value={formatEnum(profile.maritalStatus)} />
          <InfoRow label="Profile For" value={capitalize(profile.profileFor)} />
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
          <InfoRow label="Religion" value={capitalize(profile.religion)} />
          <InfoRow label="Caste" value={profile.caste || '-'} />
          <InfoRow label="Denomination" value={profile.denomination || '-'} />
          <InfoRow label="Mother Tongue" value={capitalize(profile.motherTongue)} />
          {profile.gothram && <InfoRow label="Gothram" value={profile.gothram} />}
        </CardContent>
      </Card>

      {/* Education & Career */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-700" />
            Education & Career
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Education" value={formatEnum(profile.education)} />
          {profile.educationField && <InfoRow label="Field" value={profile.educationField} />}
          {profile.occupation && <InfoRow label="Occupation" value={profile.occupation} />}
          {profile.employer && <InfoRow label="Employer" value={profile.employer} />}
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
          <InfoRow label="Country" value={profile.country} />
          {profile.state && <InfoRow label="State" value={profile.state} />}
          {profile.city && <InfoRow label="City" value={profile.city} />}
        </CardContent>
      </Card>

      {/* Family */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-700" />
            Family
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.fatherOccupation && <InfoRow label="Father" value={profile.fatherOccupation} />}
          {profile.motherOccupation && <InfoRow label="Mother" value={profile.motherOccupation} />}
          {profile.brothersCount !== undefined && <InfoRow label="Brothers" value={String(profile.brothersCount)} />}
          {profile.sistersCount !== undefined && <InfoRow label="Sisters" value={String(profile.sistersCount)} />}
          {profile.familyType && <InfoRow label="Family Type" value={formatEnum(profile.familyType)} />}
          {profile.familyValues && <InfoRow label="Family Values" value={capitalize(profile.familyValues)} />}
        </CardContent>
      </Card>

      {/* About */}
      {profile.aboutMe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary-700" />
              About Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.aboutMe}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preferences */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Partner Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const p = preferences as Record<string, unknown>;
                const ageMin = p.ageMin as number | undefined;
                const ageMax = p.ageMax as number | undefined;
                const religions = p.religions as string[] | undefined;
                const countries = p.countries as string[] | undefined;
                return (
                  <>
                    {ageMin && <Badge variant="outline">Age: {ageMin}-{ageMax}</Badge>}
                    {religions?.map((r) => <Badge key={r} variant="outline">{capitalize(r)}</Badge>)}
                    {countries?.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
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

function capitalize(str?: string): string {
  if (!str) return '-';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatEnum(str?: string): string {
  if (!str) return '-';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
