import type { ClientSession } from 'mongoose';

import { getNextSequence } from '@/database/counter.model';

// Backs every prefix-YYYYMMDD-NNNNNN sequential public ID in the platform
// (e.g. WD-20260712-000001). Sequential per UTC day and collision-resistant
// via Counter's atomic $inc (database_rules.md #5).
//
// modules/wallet/transaction-number.util.ts and modules/deposit/deposit-number.util.ts
// predate this helper and each still carry their own copy of this exact
// date-key/pad logic (their own comments already document why: refactoring
// an already-shipped, tested file was out of scope for the phase that added
// the next generator). Left untouched here for the same reason - this review
// covers Task A/B/C's new withdrawal code, not a rewrite of already-shipped
// Phase 04/05 modules. New generators, starting with
// modules/withdrawal/withdrawal-number.util.ts, use this shared helper
// instead of adding a fourth copy.
const pad = (value: number, width: number): string => value.toString().padStart(width, '0');

const buildDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1, 2);
  const day = pad(date.getUTCDate(), 2);
  return `${year}${month}${day}`;
};

export const generateSequentialNumber = async (
  prefix: string,
  date: Date = new Date(),
  session?: ClientSession,
): Promise<string> => {
  const dateKey = buildDateKey(date);
  const sequence = await getNextSequence(`${prefix}-${dateKey}`, session);
  return `${prefix}-${dateKey}-${pad(sequence, 6)}`;
};
