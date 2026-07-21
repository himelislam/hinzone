import { z } from 'zod';
import { amountSchema, stockSymbolSchema } from 'shared-validation';

// Mirrors apps/server/src/modules/stock/stock.validation.ts's
// createStockSchema/updateStockSchema - composed from the same
// shared-validation primitives the server uses, same pattern as
// deposit.validators.ts's createDepositFormSchema. Unlike the server's
// schemas, no z.preprocess string-coercion is needed here: form inputs
// already produce real numbers/booleans (Input type="number"'s
// valueAsNumber, Switch's boolean onChange) - only stock.service.ts's
// adminCreateStock/adminUpdateStock convert to FormData strings at the
// network boundary, after this validation has already run.
//
// A single schema covers both create and edit mode (unlike
// deposit.validators.ts's 2-generic useForm workaround, which exists
// because a File genuinely can't be "sent as undefined") - `currentPrice`
// is typed optional here since StockForm simply never renders that field in
// edit mode (price changes only go through PriceUpdateForm,
// tasks/breakdown/phase-07-tasks.md task 14's decision) and enforces its
// presence with a plain runtime check in onSubmit for create mode, rather
// than needing Zod-level input/output narrowing for a field that's already
// entirely absent from UpdateStockPayload's own shape.
export const stockFormSchema = z.object({
  symbol: stockSymbolSchema,
  name: z.string().trim().min(1, 'Name is required.'),
  companyName: z.string().trim().min(1, 'Company name is required.'),
  description: z.string().trim().min(1, 'Description is required.'),
  category: z.string().trim().min(1, 'Category is required.'),
  industry: z.string().trim().min(1, 'Industry is required.'),
  currentPrice: amountSchema.optional(),
  // phase-07.md's Validation section requires "Positive Shares" - mirrors
  // the server's totalSharesField (stock.validation.ts).
  totalShares: z.number().positive('Total shares must be greater than zero.'),
  minimumPurchase: amountSchema.optional(),
  maximumPurchase: amountSchema.optional(),
  allowFractionalShares: z.boolean().optional(),
  dividendEnabled: z.boolean(),
  featured: z.boolean(),
  displayOrder: z.number().int().nonnegative('Display order cannot be negative.'),
  logo: z.instanceof(File).nullable().optional(),
});

export type StockFormValues = z.infer<typeof stockFormSchema>;

// PATCH /admin/stocks/:id/price body - a single field, live-previewed by
// PriceUpdateForm.
export const priceUpdateFormSchema = z.object({
  newPrice: amountSchema,
});

export type PriceUpdateFormValues = z.infer<typeof priceUpdateFormSchema>;
