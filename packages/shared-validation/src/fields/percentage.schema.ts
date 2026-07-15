import { z } from 'zod';

// docs/20-settings-system.md #22 - commission/fee/reward percentages must fall
// within 0-100.
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative.')
  .max(100, 'Percentage cannot exceed 100.');
