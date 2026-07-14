import { z } from 'zod';

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters.')
  .max(100, 'Full name must be at most 100 characters.');
