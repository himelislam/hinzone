import type { JSX } from 'react';

import AuthCard from '@/components/common/AuthCard';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

const ResetPasswordPage = (): JSX.Element => {
  return (
    <AuthCard title="Reset your password" description="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthCard>
  );
};

export default ResetPasswordPage;
