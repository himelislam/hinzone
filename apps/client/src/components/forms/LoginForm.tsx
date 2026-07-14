import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

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
import { useLogin } from '@/hooks/useAuthMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import { loginFormSchema, type LoginFormValues } from '@/validators/auth.validators';

const LoginForm = (): JSX.Element => {
  const login = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { login: '', password: '' },
  });

  // No explicit redirect on success - once useLogin's onSuccess populates
  // AuthContext, routes/PublicRoute.tsx reactively redirects away from /login.
  const onSubmit = (values: LoginFormValues): void => {
    login.mutate(values);
  };

  const errorMessage = getErrorMessage(login.error);

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
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username, phone number, or email</FormLabel>
              <FormControl>
                <Input autoComplete="username" placeholder="johndoe" {...field} />
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
                <PasswordField autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
