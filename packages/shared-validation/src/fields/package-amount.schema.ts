import { z } from 'zod';

// Shared by deposit packages and MLM commission-rate packages - both are whole
// currency amounts greater than zero.
export const packageAmountSchema = z
  .number()
  .int('Package amount must be a whole number.')
  .positive('Package amount must be greater than zero.');
