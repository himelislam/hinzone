import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import AuthCard from '@/components/common/AuthCard';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';

const ForgotPasswordPage = (): JSX.Element => {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter the email on your account and we'll send you a reset link."
    >
      <ForgotPasswordForm />

      <p className="text-muted-foreground text-center text-sm">
        Remembered it after all?{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
