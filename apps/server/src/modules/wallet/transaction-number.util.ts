import type { ClientSession } from 'mongoose';

import { getNextSequence } from '@/database/counter.model';

// tasks/phase-04.md - Transaction Number Generator, e.g. TRX-20260712-000001.
// Sequential per UTC day and collision-resistant via Counter's atomic $inc.
const pad = (value: number, width: number): string => value.toString().padStart(width, '0');

const buildDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1, 2);
  const day = pad(date.getUTCDate(), 2);
  return `${year}${month}${day}`;
};

export const generateTransactionNumber = async (
  date: Date = new Date(),
  session?: ClientSession,
): Promise<string> => {
  const dateKey = buildDateKey(date);
  const sequence = await getNextSequence(`TRX-${dateKey}`, session);
  return `TRX-${dateKey}-${pad(sequence, 6)}`;
};
