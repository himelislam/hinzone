import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { User } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import AvatarUpload from '@/components/forms/AvatarUpload';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUpdateProfile } from '@/hooks/useProfileMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  updateProfileFormSchema,
  type UpdateProfileFormValues,
} from '@/validators/users.validators';

interface EditProfileFormProps {
  readonly user: User;
}

const EditProfileForm = ({ user }: EditProfileFormProps): JSX.Element => {
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
    },
  });

  const onSubmit = (values: UpdateProfileFormValues): void => {
    updateProfile.mutate(values, {
      onSuccess: () => void navigate('/profile'),
    });
  };

  const errorMessage = getErrorMessage(updateProfile.error);

  return (
    <div className="space-y-6">
      <AvatarUpload />

      <Form {...form}>
        <form
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          className="space-y-4"
          noValidate
        >
          <FormAlert variant="destructive" message={errorMessage} />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EditProfileForm;
