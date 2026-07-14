import { z } from 'zod';

// Bangladesh mobile numbers: 11 digits starting with 01, operator digit 3-9.
const BD_PHONE_NUMBER_REGEX = /^01[3-9]\d{8}$/;

export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(BD_PHONE_NUMBER_REGEX, 'Enter a valid Bangladesh phone number.');
