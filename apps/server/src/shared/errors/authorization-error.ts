import { AppError } from './app-error';

export class AuthorizationError extends AppError {
  constructor(message = 'You are not authorized to perform this action.') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}
