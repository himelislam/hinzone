import { AppError } from './app-error';

// tasks/phase-06.md - each withdrawal transition (approve/reject, cancel,
// mark processing, complete) is only valid from a specific prior status
// (e.g. approve/reject/cancel require PENDING; complete requires APPROVED or
// PROCESSING). One shared error class covers every guard - they differ only
// in which status(es) they accept, not in what kind of failure this
// represents (unlike deposit's single-gate DepositNotPendingError, which
// only ever guards one transition set).
export class WithdrawalInvalidTransitionError extends AppError {
  constructor(message = 'This withdrawal cannot be changed from its current status.') {
    super(message, 400, 'WITHDRAWAL_INVALID_TRANSITION');
  }
}
