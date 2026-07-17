import { z } from 'zod';
import {
  packageAmountSchema,
  paymentReferenceSchema,
  senderAccountNumberSchema,
} from 'shared-validation';

// Mirrors apps/server/src/modules/deposit/deposit.validation.ts's
// createDepositSchema - composed from the same shared-validation primitives the
// server uses, same pattern as auth.validators.ts's registerFormSchema. Unlike
// the server's schema, `packageAmount` needs no string-to-number preprocessing
// here: DepositPackageSelector's onChange already emits a real number, and only
// deposit.service.ts's createDeposit converts to FormData strings at the network
// boundary, after this validation has already run. The screenshot file itself
// is validated by ScreenshotUploader (UX only, MIME/size) - there's no
// cross-app "File" primitive in shared-validation to reuse, so it's just
// required here as a non-null check.
//
// `.refine()` on a `.nullable()` schema narrows the *output* type to exclude
// null (verified: true for zod 3.25 even with a plain boolean predicate, not
// only a `file is File` type-predicate one) - so the schema's input shape
// (`screenshot: File | null`, needed for empty defaultValues before a file is
// picked) and its validated output shape (`screenshot: File`, needed by
// CreateDepositPayload) genuinely differ. `CreateDepositFormInput`/
// `CreateDepositFormValues` capture that split; DepositForm's useForm() takes
// both generics (RHF's documented pattern for a resolver whose output differs
// from its input) instead of fighting the narrowing with a manual cast.
export const createDepositFormSchema = z.object({
  packageAmount: packageAmountSchema,
  paymentMethod: z.string().trim().min(1, 'Payment method is required.'),
  senderAccountNumber: senderAccountNumberSchema,
  paymentReference: paymentReferenceSchema,
  screenshot: z
    .instanceof(File)
    .nullable()
    .refine((file) => file !== null, {
      message: 'A payment screenshot is required.',
    }),
});

export type CreateDepositFormInput = z.input<typeof createDepositFormSchema>;
export type CreateDepositFormValues = z.output<typeof createDepositFormSchema>;
