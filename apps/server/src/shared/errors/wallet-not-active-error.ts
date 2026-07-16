import { AppError } from './app-error';

// tasks/phase-04.md - "Only ACTIVE wallets may perform financial operations."
// Covers both the LOCKED and FROZEN statuses.
export class WalletNotActiveError extends AppError {
  constructor(message = 'This wallet is not active and cannot perform financial operations.') {
    super(message, 400, 'WALLET_NOT_ACTIVE');
  }
}
