import { AppError } from './app-error';

// tasks/phase-05.md - approve/reject/cancel are only valid while a deposit is
// still PENDING; acting on one that has already been reviewed (or cancelled)
// must fail rather than silently reprocessing it.
export class DepositNotPendingError extends AppError {
  constructor(message = 'This deposit has already been reviewed and can no longer be changed.') {
    super(message, 400, 'DEPOSIT_NOT_PENDING');
  }
}
