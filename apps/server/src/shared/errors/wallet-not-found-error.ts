import { AppError } from './app-error';

export class WalletNotFoundError extends AppError {
  constructor(message = 'Wallet not found.') {
    super(message, 404, 'WALLET_NOT_FOUND');
  }
}
