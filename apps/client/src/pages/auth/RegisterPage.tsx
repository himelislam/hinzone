import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import AuthCard from '@/components/common/AuthCard';
import RegistrationForm from '@/components/forms/RegistrationForm';

const RegisterPage = (): JSX.Element => {
  return (
    <AuthCard title="Create your account" description="Start investing in just a few minutes.">
      <RegistrationForm />

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default RegisterPage;
