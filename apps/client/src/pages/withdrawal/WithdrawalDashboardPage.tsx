import type { JSX } from 'react';

import WithdrawalForm from '@/components/forms/WithdrawalForm';

// WithdrawalForm already wires useCreateWithdrawal() and renders the
// Settings-driven limits/fee text internally, so this page is a thin shell
// around it, same relationship DepositDashboardPage has to DepositForm.
const WithdrawalDashboardPage = (): JSX.Element => {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">New Withdrawal</h1>
      <WithdrawalForm />
    </div>
  );
};

export default WithdrawalDashboardPage;
