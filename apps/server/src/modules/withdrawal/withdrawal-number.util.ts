import type { ClientSession } from 'mongoose';

import { generateSequentialNumber } from '@/shared/helpers/sequential-number';

// tasks/phase-06.md - Withdrawal Number Generator, e.g. WD-20260712-000001.
// Thin wrapper around the shared generateSequentialNumber helper (see that
// file's own comment for why deposit-number.util.ts/transaction-number.util.ts
// weren't also migrated to it).
export const generateWithdrawalNumber = (
  date: Date = new Date(),
  session?: ClientSession,
): Promise<string> => generateSequentialNumber('WD', date, session);
