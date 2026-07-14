import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(4, 'Username must be at least 4 characters.')
  .max(30, 'Username must be at most 30 characters.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.');
