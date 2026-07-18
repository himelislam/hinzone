export interface WithdrawalFeeBreakdown {
  fee: number;
  netAmount: number;
}

// tasks/phase-06.md's Withdrawal Fee Calculation. Percentage-only: the
// already-shipped WithdrawalSettings type (packages/shared-types/src/settings/
// withdrawal-settings.types.ts, built in Phase 3) only defines
// `withdrawalFeePercentage` - no flat-fee field exists anywhere in the
// Settings schema, its Zod validator, or its business-rule validator.
// phase-06.md asks the fee engine to "future-proof" support for a flat fee
// too, but adding a percentage-or-fixed union would mean reopening the
// already-shipped Settings module - out of this phase's scope (see
// tasks/breakdown/phase-06-tasks.md's "decision 2"). `feePercentage: 0`
// already covers "No Fee".
//
// Isolated in its own file (rather than folded into
// withdrawal-business-rules.ts) specifically so this limitation is easy to
// find and extend later without hunting through unrelated validators.
// database_rules.md #20 - never use unrounded floating-point results for
// monetary values. Raw `(amount * feePercentage) / 100` drifts into
// non-terminating decimals for ordinary inputs (e.g. amount=99.99,
// feePercentage=33.33 -> fee=33.326667000000005) that would otherwise be
// persisted verbatim into withdrawal.model.ts's immutable withdrawalFee/
// netAmount fields. Rounded to 2 decimal places (this platform's single
// currency is USD - docs/19-business-rules.md), computed via integer cents
// to avoid re-introducing the same drift through the rounding step itself.
const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export const calculateWithdrawalFee = (
  amount: number,
  feePercentage: number,
): WithdrawalFeeBreakdown => {
  const fee = roundToCents((amount * feePercentage) / 100);
  const netAmount = roundToCents(amount - fee);

  return { fee, netAmount };
};
