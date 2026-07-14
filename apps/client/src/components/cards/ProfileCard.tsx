import type { JSX } from 'react';
import { AccountStatus } from 'shared-types';
import type { User } from 'shared-types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getInitials } from '@/utils/get-initials';

interface ProfileCardProps {
  readonly user: User;
}

type StatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

// ui_rules.md #30 - status colors must stay consistent everywhere a status is
// shown, not just here.
const STATUS_BADGE_VARIANTS: Record<AccountStatus, StatusBadgeVariant> = {
  [AccountStatus.ACTIVE]: 'success',
  [AccountStatus.PENDING]: 'warning',
  [AccountStatus.SUSPENDED]: 'destructive',
  [AccountStatus.BLOCKED]: 'destructive',
  [AccountStatus.INACTIVE]: 'secondary',
};

const ProfileCard = ({ user }: ProfileCardProps): JSX.Element => {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={user.profileImage} alt={user.fullName} />
          <AvatarFallback className="text-base">{getInitials(user.fullName)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold">{user.fullName}</p>
          <p className="text-muted-foreground text-sm">@{user.username}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={STATUS_BADGE_VARIANTS[user.status]}>{user.status}</Badge>
          <Badge variant="outline">{user.role}</Badge>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Phone number</dt>
            <dd>{user.phoneNumber}</dd>
          </div>
          {user.email ? (
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Referral ID</dt>
            <dd>{user.referralId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{new Date(user.joinDate).toLocaleDateString()}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
