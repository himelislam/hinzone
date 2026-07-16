import { AppError } from './app-error';

// tasks/phase-04.md - the Debit Operation must "prevent negative balances."
export class InsufficientBalanceError extends AppError {
  constructor(message = 'Insufficient wallet balance for this operation.') {
    super(message, 400, 'INSUFFICIENT_BALANCE');
  }
}
