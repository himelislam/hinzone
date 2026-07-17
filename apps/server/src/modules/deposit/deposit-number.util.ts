import type { ClientSession } from 'mongoose';

import { getNextSequence } from '@/database/counter.model';

// tasks/phase-05.md - Deposit Number Generator, e.g. DEP-20260712-000001.
// Sequential per UTC day and collision-resistant via Counter's atomic $inc, same
// approach as wallet/transaction-number.util.ts's generateTransactionNumber
// (counter.model.ts's key is scoped per prefix+day precisely so both generators
// can share the one Counter collection without colliding). Duplicated rather
// than extracted into a shared helper - refactoring transaction-number.util.ts
// is outside this phase's scope.
const pad = (value: number, width: number): string => value.toString().padStart(width, '0');

const buildDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1, 2);
  const day = pad(date.getUTCDate(), 2);
  return `${year}${month}${day}`;
};

export const generateDepositNumber = async (
  date: Date = new Date(),
  session?: ClientSession,
): Promise<string> => {
  const dateKey = buildDateKey(date);
  const sequence = await getNextSequence(`DEP-${dateKey}`, session);
  return `DEP-${dateKey}-${pad(sequence, 6)}`;
};
