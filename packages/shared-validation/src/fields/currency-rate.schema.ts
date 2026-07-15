import { z } from 'zod';

// docs/20-settings-system.md #22 - exchange rates must be greater than zero.
export const currencyRateSchema = z.number().positive('Exchange rate must be greater than zero.');
