import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';

import FormAlert from '@/components/common/FormAlert';
import PasswordField from '@/components/forms/PasswordField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useResetPassword } from '@/hooks/useAuthMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from '@/validators/auth.validators';

const ResetPasswordForm = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          This password reset link is invalid or missing. Request a new one from the{' '}
          <Link to="/forgot-password" className="underline underline-offset-4">
            forgot password
          </Link>{' '}
          page.
        </AlertDescription>
      </Alert>
    );
  }

  const onSubmit = (values: ResetPasswordFormValues): void => {
    resetPassword.mutate({ token, ...values });
  };

  const errorMessage = getErrorMessage(resetPassword.error);

  if (resetPassword.isSuccess) {
    return (
      <div className="space-y-4">
        <FormAlert variant="success" message={resetPassword.data} />
        <Button asChild className="w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

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

        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </Form>
  );
};

export default ResetPasswordForm;
