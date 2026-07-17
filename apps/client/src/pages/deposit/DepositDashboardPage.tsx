import type { JSX } from 'react';

import DepositForm from '@/components/forms/DepositForm';

// tasks/phase-05.md's Create Deposit page - DepositForm already wires
// useCreateDeposit() and renders the Settings-driven instructions/company
// numbers (via PaymentMethodCard) internally, so this page is a thin shell
// around it, same relationship WalletDashboardPage has to WalletCard/WalletSummary.
const DepositDashboardPage = (): JSX.Element => {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">New Deposit</h1>
      <DepositForm />
    </div>
  );
};

export default DepositDashboardPage;
