import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import ProfileCard from '@/components/cards/ProfileCard';
import CurrentUserGate from '@/components/common/CurrentUserGate';
import { Button } from '@/components/ui/button';

const ProfilePage = (): JSX.Element => {
  return (
    <CurrentUserGate>
      {(user) => (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <Button asChild variant="outline">
              <Link to="/profile/edit">Edit profile</Link>
            </Button>
          </div>

          <ProfileCard user={user} />
        </div>
      )}
    </CurrentUserGate>
  );
};

export default ProfilePage;
