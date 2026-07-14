import type { JSX } from 'react';

import CurrentUserGate from '@/components/common/CurrentUserGate';
import EditProfileForm from '@/components/forms/EditProfileForm';

const EditProfilePage = (): JSX.Element => {
  return (
    <CurrentUserGate>
      {(user) => (
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-2xl font-semibold">Edit profile</h1>
          <EditProfileForm user={user} />
        </div>
      )}
    </CurrentUserGate>
  );
};

export default EditProfilePage;
