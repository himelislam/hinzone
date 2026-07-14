import { useRef } from 'react';
import type { ChangeEvent, JSX } from 'react';
import { Camera, Loader2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUploadProfileImage } from '@/hooks/useProfileMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import { getInitials } from '@/utils/get-initials';

// Matches the mime types the backend's multer filter actually accepts
// (apps/server/src/config/upload.ts) - a pure UX affordance, the server remains
// the authoritative validator regardless.
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

const AvatarUpload = (): JSX.Element => {
  const { user } = useAuth();
  const uploadProfileImage = useUploadProfileImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      uploadProfileImage.mutate(file);
    }
  };

  const errorMessage = getErrorMessage(uploadProfileImage.error);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="size-24">
          <AvatarImage src={user?.profileImage} alt={user?.fullName} />
          <AvatarFallback className="text-lg">{getInitials(user?.fullName)}</AvatarFallback>
        </Avatar>

        {uploadProfileImage.isPending ? (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="absolute right-0 bottom-0 rounded-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadProfileImage.isPending}
          aria-label="Change profile photo"
        >
          <Camera className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      {errorMessage ? <p className="text-destructive text-sm">{errorMessage}</p> : null}
    </div>
  );
};

export default AvatarUpload;
