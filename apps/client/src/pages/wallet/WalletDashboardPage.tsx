import type { JSX } from 'react';

import WalletCard from '@/components/cards/WalletCard';
import WalletSummary from '@/components/cards/WalletSummary';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useWallet, useWalletSummary } from '@/hooks/useWalletQueries';

// tasks/phase-04.md's Wallet Dashboard - assembles WalletCard + WalletSummary,
// wired to useWallet()/useWalletSummary(). currencySymbol/decimalPrecision come
// from useCurrencySettings() (already built) rather than being hardcoded, per
// ui_rules.md #31 - "financial information must always use centralized
// formatting utilities" and "respect Settings currency configuration." Currency
// settings loading/erroring never blocks the page - formatCurrency already
// degrades gracefully to no symbol when it isn't available yet.
const WalletDashboardPage = (): JSX.Element => {
  const walletQuery = useWallet();
  const summaryQuery = useWalletSummary();
  const currencySettingsQuery = useCurrencySettings();

  if (walletQuery.isLoading || summaryQuery.isLoading) {
    return <LoadingState message="Loading your wallet..." />;
  }

  if (walletQuery.isError || summaryQuery.isError || !walletQuery.data || !summaryQuery.data) {
    return (
      <ErrorState
        message="We couldn't load your wallet."
        onRetry={() => {
          void walletQuery.refetch();
          void summaryQuery.refetch();
        }}
      />
    );
  }

  const currencySymbol = currencySettingsQuery.data?.currencySymbol;
  const decimalPrecision = currencySettingsQuery.data?.decimalPrecision;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Wallet</h1>

      <WalletCard
        wallet={walletQuery.data}
        currencySymbol={currencySymbol}
        decimalPrecision={decimalPrecision}
      />

      <WalletSummary
        summary={summaryQuery.data}
        currencySymbol={currencySymbol}
        decimalPrecision={decimalPrecision}
      />
    </div>
  );
};

export default WalletDashboardPage;
