import { AppError, type ErrorDetail } from './app-error';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed.', errors?: ReadonlyArray<ErrorDetail>) {
    super(message, 422, 'VALIDATION_ERROR', errors);
  }
}
