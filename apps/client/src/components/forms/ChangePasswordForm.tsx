import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import FormAlert from '@/components/common/FormAlert';
import PasswordField from '@/components/forms/PasswordField';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useChangePassword } from '@/hooks/useAuthMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '@/validators/auth.validators';

const ChangePasswordForm = (): JSX.Element => {
  const changePassword = useChangePassword();
  const navigate = useNavigate();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = (values: ChangePasswordFormValues): void => {
    // Revokes every session, including this one (see hooks/useAuthMutations.ts's
    // useChangePassword, which clears AuthContext on success) - send the user back
    // to sign in with their new credentials rather than leaving them on a page
    // they're no longer authenticated for.
    changePassword.mutate(values, {
      onSuccess: () => {
        void navigate('/login', {
          replace: true,
          state: { message: 'Password changed successfully. Please sign in again.' },
        });
      },
    });
  };

  const errorMessage = getErrorMessage(changePassword.error);

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="space-y-4"
        noValidate
      >
        <FormAlert variant="destructive" message={errorMessage} />

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <PasswordField autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordField autoComplete="new-password" showStrengthHint {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <PasswordField autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={changePassword.isPending}>
          {changePassword.isPending ? 'Updating...' : 'Change password'}
        </Button>
      </form>
    </Form>
  );
};

export default ChangePasswordForm;
