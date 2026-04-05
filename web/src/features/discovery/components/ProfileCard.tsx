import { Link } from 'react-router-dom';
import { MapPin, GraduationCap, Briefcase, User, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { formatHeight } from '@/lib/utils/format';
import { profileDetailPath } from '@/lib/constants/routes';
import type { DiscoveryProfile } from '../api/discovery-api';

interface ProfileCardProps {
  profile: DiscoveryProfile;
  className?: string;
  compact?: boolean;
}

function formatEnum(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ProfileCard({ profile, className, compact }: ProfileCardProps) {
  if (compact) {
    return (
      <Link to={profileDetailPath(profile.userId)}>
        <Card className={cn('overflow-hidden border-0 shadow-soft hover-lift cursor-pointer group', className)}>
          <div className="aspect-[3/4] relative bg-muted overflow-hidden">
            {profile.primaryPhotoUrl ? (
              <img src={profile.primaryPhotoUrl} alt={profile.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-warm-100">
                <User className="h-10 w-10 text-primary-200" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <h3 className="font-heading font-bold text-white text-xs truncate">{profile.name}, {profile.age}</h3>
              <span className="text-[10px] text-white/70 truncate block">{profile.country}</span>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={profileDetailPath(profile.userId)}>
      <Card
        className={cn(
          'overflow-hidden border-0 shadow-soft hover-lift cursor-pointer group',
          className,
        )}
      >
        {/* Photo */}
        <div className="aspect-[3/4] relative bg-muted overflow-hidden">
          {profile.primaryPhotoUrl ? (
            <img
              src={profile.primaryPhotoUrl}
              alt={profile.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-warm-100">
              <User className="h-16 w-16 text-primary-200" />
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Name + age on photo */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3
              className="font-heading font-bold text-white text-sm sm:text-base truncate"
              title={profile.name}
            >
              {profile.name}, {profile.age}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-white/70" />
              <span className="text-[11px] text-white/70 truncate">
                {profile.city ? `${profile.city}, ` : ''}
                {profile.country}
              </span>
            </div>
          </div>

          {/* Like button overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur-sm">
              <Heart className="h-4 w-4 text-primary-700" />
            </div>
          </div>

          {/* Verified badge */}
          {profile.primaryPhotoUrl && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="success"
                className="text-[9px] backdrop-blur-sm bg-emerald-500/90 border-0"
              >
                Verified
              </Badge>
            </div>
          )}
        </div>

        {/* Details */}
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <GraduationCap className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatEnum(profile.education)}</span>
            </div>

            {profile.occupation && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Briefcase className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatEnum(profile.occupation)}</span>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[9px] px-2 py-0">
              {formatEnum(profile.religion)}
            </Badge>
            <Badge variant="outline" className="text-[9px] px-2 py-0">
              {formatHeight(profile.height)}
            </Badge>
            {profile.caste && (
              <Badge variant="outline" className="text-[9px] px-2 py-0">
                {formatEnum(profile.caste)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
