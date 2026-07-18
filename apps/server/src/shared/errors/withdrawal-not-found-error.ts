import { AppError } from './app-error';

export class WithdrawalNotFoundError extends AppError {
  constructor(message = 'Withdrawal not found.') {
    super(message, 404, 'WITHDRAWAL_NOT_FOUND');
  }
}
