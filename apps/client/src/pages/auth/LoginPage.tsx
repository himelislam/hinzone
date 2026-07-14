import type { JSX } from 'react';
import { Link, useLocation } from 'react-router-dom';

import AuthCard from '@/components/common/AuthCard';
import FormAlert from '@/components/common/FormAlert';
import LoginForm from '@/components/forms/LoginForm';

interface LoginLocationState {
  readonly message?: string;
}

const LoginPage = (): JSX.Element => {
  const location = useLocation();
  const state = location.state as LoginLocationState | null;

  return (
    <AuthCard title="Sign in" description="Enter your credentials to access your account.">
      <FormAlert variant="success" message={state?.message} />

      <LoginForm />

      <p className="text-muted-foreground text-center text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-foreground underline underline-offset-4">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
