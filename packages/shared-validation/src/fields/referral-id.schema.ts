import { z } from 'zod';

// Referral IDs are generated as REF followed by a numeric sequence, e.g. REF100001.
const REFERRAL_ID_REGEX = /^REF\d{6,}$/;

export const referralIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(REFERRAL_ID_REGEX, 'Enter a valid referral ID.');
