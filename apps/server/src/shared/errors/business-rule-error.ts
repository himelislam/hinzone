import { AppError } from './app-error';

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BUSINESS_RULE_VIOLATION');
  }
}
