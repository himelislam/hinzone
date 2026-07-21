import { AppError } from './app-error';

export class StockSymbolAlreadyExistsError extends AppError {
  constructor(message = 'A stock with this symbol already exists.') {
    super(message, 409, 'STOCK_SYMBOL_ALREADY_EXISTS');
  }
}
