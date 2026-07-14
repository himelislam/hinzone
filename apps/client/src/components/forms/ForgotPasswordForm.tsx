import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import FormAlert from '@/components/common/FormAlert';
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
import { useForgotPassword } from '@/hooks/useAuthMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from '@/validators/auth.validators';

const ForgotPasswordForm = (): JSX.Element => {
  const forgotPassword = useForgotPassword();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: ForgotPasswordFormValues): void => {
    forgotPassword.mutate(values);
  };

  const errorMessage = getErrorMessage(forgotPassword.error);

  if (forgotPassword.isSuccess) {
    return <FormAlert variant="success" message={forgotPassword.data} />;
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
          {forgotPassword.isPending ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </Form>
  );
};

export default ForgotPasswordForm;
