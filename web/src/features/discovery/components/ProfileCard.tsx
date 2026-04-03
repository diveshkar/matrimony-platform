import { Link } from 'react-router-dom';
import { MapPin, GraduationCap, Briefcase, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { formatHeight } from '@/lib/utils/format';
import { profileDetailPath } from '@/lib/constants/routes';
import type { DiscoveryProfile } from '../api/discovery-api';

interface ProfileCardProps {
  profile: DiscoveryProfile;
  className?: string;
}

function formatEnum(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ProfileCard({ profile, className }: ProfileCardProps) {
  return (
    <Link to={profileDetailPath(profile.userId)}>
      <Card className={cn('overflow-hidden border-0 shadow-soft hover-lift cursor-pointer group', className)}>
        {/* Photo */}
        <div className="aspect-[4/5] relative bg-muted">
          {profile.primaryPhotoUrl ? (
            <img
              src={profile.primaryPhotoUrl}
              alt={profile.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
              <User className="h-16 w-16 text-primary-300" />
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge variant="default" className="text-xs">
              {profile.age}y
            </Badge>
            {profile.primaryPhotoUrl && (
              <Badge variant="success" className="text-xs">Verified</Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-4">
          <h3 className="font-heading font-semibold text-base truncate group-hover:text-primary-800 transition-colors" title={profile.name}>
            {profile.name}
          </h3>

          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formatEnum(profile.education)}</span>
            </div>

            {profile.occupation && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{profile.occupation}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{formatEnum(profile.religion)}</Badge>
            <Badge variant="outline" className="text-[10px]">{formatHeight(profile.height)}</Badge>
            {profile.caste && <Badge variant="outline" className="text-[10px]">{profile.caste}</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
