import { z } from 'zod';

// The account a withdrawal's funds should be paid out to (bKash, Nagad, or a
// future payment method's own identifier) - deliberately generic rather than
// Bangladesh-mobile-specific (phoneNumberSchema), since paymentMethod is
// Settings-driven, same reasoning as senderAccountNumberSchema. Kept as its
// own primitive rather than reused from senderAccountNumberSchema: that name
// specifically means "the account the user paid *from*" (deposits), while
// this one means "the account funds should be *sent to*" (withdrawals) - the
// validation shape is identical, but the semantic field differs.
export const receiverAccountNumberSchema = z
  .string()
  .trim()
  .min(1, 'Receiver account number is required.')
  .max(50, 'Receiver account number must be at most 50 characters.');
