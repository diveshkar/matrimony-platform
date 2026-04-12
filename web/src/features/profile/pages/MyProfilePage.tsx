import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Edit,
  MapPin,
  GraduationCap,
  Users,
  Heart,
  Calendar,
  Camera,
  Crown,
  User,
  Briefcase,
  Zap,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useMyProfile, useBoostStatus, useActivateBoost } from '../hooks/useProfile';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { calculateAge, formatHeight } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';

export default function MyProfilePage() {
  const { data: response, isLoading, isError, refetch } = useMyProfile();
  const { data: subResponse } = useMySubscription();
  const { data: boostResponse } = useBoostStatus();
  const activateBoost = useActivateBoost();
  const navigate = useNavigate();
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-52 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Could not load profile"
        description="Please try again later."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  if (!response?.success) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const { profile, preferences } = response.data;
  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const isPremium = planId !== 'free';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-0 shadow-soft-lg">
          <div className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent-400/10 blur-[60px]" />
            </div>

            <div className="relative flex flex-col sm:flex-row items-center gap-5">
              {/* Photo */}
              <Link to={ROUTES.MY_PHOTOS} className="group relative shrink-0">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-3 border-white/20 shadow-xl">
                  {profile.primaryPhotoUrl ? (
                    <img
                      src={profile.primaryPhotoUrl}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary-700">
                      <User className="h-12 w-12 text-primary-300" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </Link>

              {/* Info */}
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
                    {profile.name}
                  </h1>
                  {isPremium && (
                    <Badge variant="gold" className="text-[10px]">
                      <Crown className="mr-1 h-3 w-3" />
                      {planLabel}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5 text-sm text-white/60">
                  {age && <span>{age} years</span>}
                  {profile.height && <span>{formatHeight(profile.height)}</span>}
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {profile.city}, {profile.country}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-8"
                    asChild
                  >
                    <Link to={ROUTES.EDIT_PROFILE}>
                      <Edit className="mr-1.5 h-3 w-3" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8 text-white/70 hover:text-white hover:bg-white/10"
                    asChild
                  >
                    <Link to={ROUTES.MY_PHOTOS}>
                      <Camera className="mr-1.5 h-3 w-3" />
                      Photos
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setBoostDialogOpen(true)}
                    className={`text-xs h-8 ${
                      boostResponse?.success && boostResponse.data.isActive
                        ? 'bg-accent-500 hover:bg-accent-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Zap className="mr-1.5 h-3 w-3" />
                    {boostResponse?.success && boostResponse.data.isActive ? 'Boosted' : 'Boost'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Completion bar */}
          {profile.profileCompletion < 100 && (
            <div className="px-6 py-3 bg-primary-50/50 border-t flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs text-muted-foreground">Profile completion</span>
                <div className="flex-1 max-w-xs h-1.5 rounded-full bg-primary-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-700 to-primary-500 transition-all"
                    style={{ width: `${profile.profileCompletion}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-primary-800">
                {profile.profileCompletion}%
              </span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Quick badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="py-1 px-3">
          {formatEnum(profile.religion)}
        </Badge>
        {profile.caste && (
          <Badge variant="outline" className="py-1 px-3">
            {formatEnum(profile.caste)}
          </Badge>
        )}
        <Badge variant="outline" className="py-1 px-3">
          {formatEnum(profile.education)}
        </Badge>
        <Badge variant="outline" className="py-1 px-3">
          {formatEnum(profile.maritalStatus)}
        </Badge>
        <Badge variant="outline" className="py-1 px-3">
          {capitalize(profile.motherTongue)}
        </Badge>
      </div>

      {/* About */}
      {profile.aboutMe && (
        <Card className="border-0 shadow-soft">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
              &ldquo;{profile.aboutMe}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info sections in grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Basic Info */}
        <SectionCard icon={Heart} title="Basic Info">
          <InfoRow label="Name" value={profile.name} />
          <InfoRow
            label="Age"
            value={age ? `${age} years` : '-'}
          />
          <InfoRow
            label="Height"
            value={profile.height ? formatHeight(profile.height) : '-'}
          />
          <InfoRow label="Gender" value={capitalize(profile.gender)} />
          <InfoRow label="Marital Status" value={formatEnum(profile.maritalStatus)} />
          <InfoRow label="Profile For" value={capitalize(profile.profileFor)} />
        </SectionCard>

        {/* Cultural */}
        <SectionCard icon={Calendar} title="Cultural">
          <InfoRow label="Religion" value={capitalize(profile.religion)} />
          <InfoRow label="Caste" value={formatEnum(profile.caste) || '-'} />
          <InfoRow label="Denomination" value={formatEnum(profile.denomination) || '-'} />
          <InfoRow label="Mother Tongue" value={capitalize(profile.motherTongue)} />
          {profile.raasi && <InfoRow label="Raasi" value={profile.raasi} />}
          {profile.natchathiram && <InfoRow label="Natchathiram" value={profile.natchathiram} />}
        </SectionCard>

        {/* Education */}
        <SectionCard icon={GraduationCap} title="Education & Career">
          <InfoRow label="Education" value={formatEnum(profile.education)} />
          {profile.educationField && (
            <InfoRow label="Field" value={formatEnum(profile.educationField)} />
          )}
          {profile.occupation && (
            <InfoRow label="Occupation" value={formatEnum(profile.occupation)} />
          )}
          {profile.employer && <InfoRow label="Employer" value={profile.employer} />}
        </SectionCard>

        {/* Location */}
        <SectionCard icon={MapPin} title="Location">
          <InfoRow label="Country" value={profile.country} />
          {profile.state && <InfoRow label="State" value={profile.state} />}
          {profile.city && <InfoRow label="City" value={profile.city} />}
        </SectionCard>
      </div>

      {/* Family - full width */}
      <SectionCard icon={Users} title="Family">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {profile.fatherOccupation && (
            <InfoRow label="Father" value={profile.fatherOccupation} />
          )}
          {profile.motherOccupation && (
            <InfoRow label="Mother" value={profile.motherOccupation} />
          )}
          {profile.brothersCount !== undefined && (
            <InfoRow label="Brothers" value={String(profile.brothersCount)} />
          )}
          {profile.sistersCount !== undefined && (
            <InfoRow label="Sisters" value={String(profile.sistersCount)} />
          )}
          {profile.familyType && (
            <InfoRow label="Family Type" value={formatEnum(profile.familyType)} />
          )}
          {profile.familyValues && (
            <InfoRow label="Family Values" value={capitalize(profile.familyValues)} />
          )}
        </div>
      </SectionCard>

      {/* Partner Preferences */}
      {preferences && (
        <SectionCard icon={Briefcase} title="Partner Preferences" editHref={ROUTES.EDIT_PREFERENCES}>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const p = preferences as Record<string, unknown>;
              const ageMin = p.ageMin as number | undefined;
              const ageMax = p.ageMax as number | undefined;
              const religions = p.religions as string[] | undefined;
              const countries = p.countries as string[] | undefined;
              const educations = p.educations as string[] | undefined;
              return (
                <>
                  {ageMin && (
                    <Badge variant="secondary" className="py-1">
                      Age: {ageMin}-{ageMax}
                    </Badge>
                  )}
                  {religions?.map((r) => (
                    <Badge key={r} variant="secondary" className="py-1">
                      {capitalize(r)}
                    </Badge>
                  ))}
                  {countries?.map((c) => (
                    <Badge key={c} variant="secondary" className="py-1">
                      {c}
                    </Badge>
                  ))}
                  {educations?.map((e) => (
                    <Badge key={e} variant="secondary" className="py-1">
                      {formatEnum(e)}
                    </Badge>
                  ))}
                </>
              );
            })()}
          </div>
        </SectionCard>
      )}

      {/* Boost Dialog */}
      <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {(() => {
            const boost = boostResponse?.success ? boostResponse.data : null;
            const canBoost = boost?.canBoost;
            const isActive = boost?.isActive;
            const boostsTotal = boost?.boostsTotal || 0;
            const boostsUsed = boost?.boostsUsed || 0;
            const noBoostPlan = boostsTotal <= 0;

            if (noBoostPlan) {
              return (
                <>
                  <DialogHeader>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50">
                      <Zap className="h-7 w-7 text-accent-600" />
                    </div>
                    <DialogTitle className="text-center">Profile Boost</DialogTitle>
                    <DialogDescription className="text-center">
                      Boost your profile to appear at the top of discovery results for 24 hours.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-primary-50/50 rounded-xl p-4 text-sm text-primary-800 space-y-1.5">
                    <p className="font-medium">Available on Gold and Platinum:</p>
                    <ul className="text-xs text-primary-700 space-y-1">
                      <li className="flex items-center gap-2"><Crown className="h-3.5 w-3.5 shrink-0" />Gold: 1 boost per month</li>
                      <li className="flex items-center gap-2"><Crown className="h-3.5 w-3.5 shrink-0" />Platinum: 3 boosts per month</li>
                    </ul>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBoostDialogOpen(false)}>Maybe Later</Button>
                    <Button className="flex-1 rounded-xl shadow-glow" onClick={() => { setBoostDialogOpen(false); navigate(ROUTES.PLANS); }}>
                      <Crown className="mr-2 h-4 w-4" />Upgrade Plan
                    </Button>
                  </div>
                </>
              );
            }

            if (isActive) {
              const hoursLeft = boost?.expiresAt ? Math.max(1, Math.ceil((new Date(boost.expiresAt).getTime() - Date.now()) / 3600000)) : 0;
              return (
                <>
                  <DialogHeader>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100">
                      <Zap className="h-7 w-7 text-accent-600 fill-accent-600" />
                    </div>
                    <DialogTitle className="text-center">Profile is Boosted!</DialogTitle>
                    <DialogDescription className="text-center">
                      Your profile is appearing at the top of discovery results.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-accent-50 rounded-xl p-5 text-center">
                    <p className="text-3xl font-heading font-bold text-accent-700">{hoursLeft}h</p>
                    <p className="text-xs text-accent-600 mt-1">remaining</p>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">{boostsUsed} of {boostsTotal} boosts used this month</p>
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => setBoostDialogOpen(false)}>Close</Button>
                </>
              );
            }

            return (
              <>
                <DialogHeader>
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50">
                    <Zap className="h-7 w-7 text-accent-600" />
                  </div>
                  <DialogTitle className="text-center">Boost Your Profile</DialogTitle>
                  <DialogDescription className="text-center">
                    Appear at the top of discovery results for 24 hours and get more visibility.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-accent-50/50 rounded-xl p-4 text-sm space-y-2">
                  <p className="font-medium text-accent-800">What happens when you boost:</p>
                  <ul className="text-xs text-accent-700 space-y-1.5">
                    <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 shrink-0" />Profile appears at the top of all matching users</li>
                    <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 shrink-0" />Lasts for 24 hours</li>
                    <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 shrink-0" />Get up to 10x more profile views</li>
                  </ul>
                </div>
                <p className="text-xs text-center text-muted-foreground">{boostsUsed} of {boostsTotal} boosts used this month</p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBoostDialogOpen(false)}>Cancel</Button>
                  <Button
                    className="flex-1 rounded-xl bg-accent-600 hover:bg-accent-700 text-white shadow-glow"
                    disabled={!canBoost || activateBoost.isPending}
                    onClick={async () => {
                      await activateBoost.mutateAsync();
                      setBoostDialogOpen(false);
                    }}
                  >
                    {activateBoost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="mr-2 h-4 w-4" />Boost Now</>}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  editHref,
  children,
}: {
  icon: typeof Heart;
  title: string;
  editHref?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
            <Icon className="h-3.5 w-3.5 text-primary-700" />
          </div>
          {title}
          {editHref && (
            <Link to={editHref} className="ml-auto text-xs text-primary-700 hover:underline font-medium">
              Edit
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function capitalize(str?: string): string {
  if (!str) return '-';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatEnum(str?: string): string {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
