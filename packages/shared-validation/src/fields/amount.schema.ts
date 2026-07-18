import { z } from 'zod';

// docs/19-business-rules.md - wallet credit/debit and future deposit/withdrawal
// amounts must be positive. Decimal precision is a Settings-driven currency
// concern (docs/20-settings-system.md #22), so it is not fixed here.
// `.finite()` rejects Infinity/-Infinity - z.number() alone only rejects NaN,
// so without it a JSON body like {"amount": 1e400} (parsed by JS as Infinity)
// would pass this schema as a "valid" amount.
export const amountSchema = z
  .number()
  .positive('Amount must be greater than zero.')
  .finite('Amount must be a finite number.');
