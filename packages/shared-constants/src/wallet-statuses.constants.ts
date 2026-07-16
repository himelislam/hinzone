import { WalletStatus } from 'shared-types';

export const WALLET_STATUSES: readonly WalletStatus[] = Object.values(
  WalletStatus,
) as WalletStatus[];
