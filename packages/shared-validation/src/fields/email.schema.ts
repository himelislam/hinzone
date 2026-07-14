import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.');
