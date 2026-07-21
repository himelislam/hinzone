import { AppError } from './app-error';

export class StockNotFoundError extends AppError {
  constructor(message = 'Stock not found.') {
    super(message, 404, 'STOCK_NOT_FOUND');
  }
}
