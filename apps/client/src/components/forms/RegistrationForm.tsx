import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';

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
import { Input } from '@/components/ui/input';
import { useRegister } from '@/hooks/useAuthMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import { registerFormSchema, type RegisterFormValues } from '@/validators/auth.validators';

const RegistrationForm = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const register = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      referrerId: searchParams.get('ref') ?? '',
    },
  });

  // Once registered, the mutation logs the user in immediately (the backend
  // returns tokens just like login) - routes/PublicRoute.tsx then redirects away
  // from /register on its own once AuthContext's isAuthenticated flips, so no
  // explicit navigation is needed here.
  const onSubmit = (values: RegisterFormValues): void => {
    register.mutate({
      ...values,
      email: values.email || undefined,
      referrerId: values.referrerId || undefined,
    });
  };

  const errorMessage = getErrorMessage(register.error);

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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input autoComplete="username" placeholder="johndoe" {...field} />
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
                <Input autoComplete="tel" placeholder="01712345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address (optional)</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordField autoComplete="new-password" showStrengthHint {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordField autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referrerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referral ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="REF100001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
};

export default RegistrationForm;
