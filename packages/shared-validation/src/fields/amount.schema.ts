import { z } from 'zod';

// docs/19-business-rules.md - wallet credit/debit and future deposit/withdrawal
// amounts must be positive. Decimal precision is a Settings-driven currency
// concern (docs/20-settings-system.md #22), so it is not fixed here.
export const amountSchema = z.number().positive('Amount must be greater than zero.');
