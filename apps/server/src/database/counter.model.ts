import { Schema, model } from 'mongoose';
import type { ClientSession, Model } from 'mongoose';

// Backs every sequential, collision-resistant public ID in the platform (starting
// with TRX-YYYYMMDD-NNNNNN in wallet/transaction-number.util.ts; future DEP-/WD-
// generators reuse this same collection with their own key prefix -
// database_rules.md #5). `key` is scoped per prefix+period (e.g. "TRX-20260715")
// so each day's sequence restarts at 1.
interface ICounter {
  key: string;
  sequence: number;
}

type CounterModel = Model<ICounter>;

const counterSchema = new Schema<ICounter, CounterModel>({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  sequence: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Counter = model<ICounter, CounterModel>('Counter', counterSchema, 'counters');

// Atomic $inc + upsert avoids the lost-update race a read-modify-write would be
// exposed to under concurrent transaction creation (database_rules.md #12).
export const getNextSequence = async (key: string, session?: ClientSession): Promise<number> => {
  // Mongoose's overloads already narrow the return type to exclude null when
  // `upsert: true` is present in the options, so no cast is needed here.
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, session },
  ).exec();

  return counter.sequence;
};
