import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import FormAlert from '@/components/common/FormAlert';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCurrencySettings, useWithdrawalSettings } from '@/hooks/useSettingsQueries';
import { useCreateWithdrawal } from '@/hooks/useWithdrawalMutations';
import { formatCurrency } from '@/utils/format-currency';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  createWithdrawalFormSchema,
  type CreateWithdrawalFormValues,
} from '@/validators/withdrawal.validators';

import CurrencyInput from './CurrencyInput';
import FeeCalculator from './FeeCalculator';
import PaymentMethodSelector from './PaymentMethodSelector';

// tasks/phase-06.md's "Withdrawal Form" section - assembles
// PaymentMethodSelector/CurrencyInput/FeeCalculator, all driven by the same
// useWithdrawalSettings() query so limits/fee/payment methods are never
// hardcoded, and submits via useCreateWithdrawal(). No file-input concern -
// simpler than DepositForm's two-generic useForm() workaround, since there's
// no File-typed field whose Zod input/output shapes diverge.
const WithdrawalForm = (): JSX.Element => {
  const { data: withdrawalSettings, isLoading, isError } = useWithdrawalSettings();
  const { data: currencySettings } = useCurrencySettings();
  const createWithdrawal = useCreateWithdrawal();

  const form = useForm<CreateWithdrawalFormValues>({
    resolver: zodResolver(createWithdrawalFormSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: '',
      receiverAccountNumber: '',
      accountHolderName: '',
    },
  });

  // useWatch(), not form.watch() - watch() returns a plain function React
  // Compiler can't safely memoize (it would skip memoizing this whole
  // component and risk stale UI); useWatch() is the hook-based, compiler-safe
  // equivalent and is the only place in this codebase so far that needs a
  // live-reactive field value to drive another component (FeeCalculator).
  const amount = useWatch({ control: form.control, name: 'amount' });

  const onSubmit = (values: CreateWithdrawalFormValues): void => {
    createWithdrawal.mutate(values, { onSuccess: () => form.reset() });
  };

  const errorMessage = getErrorMessage(createWithdrawal.error);

  if (isLoading) {
    return <LoadingState message="Loading withdrawal options..." />;
  }

  if (isError || !withdrawalSettings) {
    return (
      <FormAlert
        variant="destructive"
        message="Unable to load withdrawal settings. Please try again."
      />
    );
  }

  const currencySymbol = currencySettings?.currencySymbol;
  const decimalPrecision = currencySettings?.decimalPrecision;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="space-y-4"
        noValidate
      >
        <FormAlert variant="destructive" message={errorMessage} />
        <FormAlert
          variant="success"
          message={createWithdrawal.isSuccess ? 'Withdrawal request submitted successfully.' : null}
        />

        <p className="text-muted-foreground text-sm">
          Withdraw between{' '}
          {formatCurrency(withdrawalSettings.minimumWithdrawal, currencySymbol, decimalPrecision)}{' '}
          and{' '}
          {formatCurrency(withdrawalSettings.maximumWithdrawal, currencySymbol, decimalPrecision)}.
          A {withdrawalSettings.withdrawalFeePercentage}% fee applies, and processing takes up to{' '}
          {withdrawalSettings.processingTimeHours} hours after approval. Withdrawals are only
          available {withdrawalSettings.waitingPeriodDays} days after your first approved deposit.
        </p>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  currencySymbol={currencySymbol}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FeeCalculator
          amount={amount}
          feePercentage={withdrawalSettings.withdrawalFeePercentage}
          currencySymbol={currencySymbol}
          decimalPrecision={decimalPrecision}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PaymentMethodSelector
                  paymentMethods={withdrawalSettings.paymentMethods}
                  value={field.value || undefined}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receiverAccountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receiver account number</FormLabel>
              <FormControl>
                <Input placeholder="01712345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountHolderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account holder name</FormLabel>
              <FormControl>
                <Input placeholder="Full name on the receiving account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={createWithdrawal.isPending}>
          {createWithdrawal.isPending ? 'Submitting...' : 'Submit withdrawal request'}
        </Button>
      </form>
    </Form>
  );
};

export default WithdrawalForm;
