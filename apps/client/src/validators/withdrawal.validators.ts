import { z } from 'zod';
import { amountSchema, fullNameSchema, receiverAccountNumberSchema } from 'shared-validation';

// Mirrors apps/server/src/modules/withdrawal/withdrawal.validation.ts's
// createWithdrawalSchema - composed from the same shared-validation
// primitives the server uses, same pattern as deposit.validators.ts's
// createDepositFormSchema. Unlike that one, no two-generic useForm()
// workaround is needed here - there's no File-typed field whose Zod
// input/output shapes diverge, so a single z.infer<> is sufficient.
export const createWithdrawalFormSchema = z.object({
  amount: amountSchema,
  paymentMethod: z.string().trim().min(1, 'Payment method is required.'),
  receiverAccountNumber: receiverAccountNumberSchema,
  accountHolderName: fullNameSchema,
});

export type CreateWithdrawalFormValues = z.infer<typeof createWithdrawalFormSchema>;
