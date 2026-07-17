import { AppError } from './app-error';

export class DepositNotFoundError extends AppError {
  constructor(message = 'Deposit not found.') {
    super(message, 404, 'DEPOSIT_NOT_FOUND');
  }
}
