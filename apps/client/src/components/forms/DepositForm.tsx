import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import FormAlert from '@/components/common/FormAlert';
import LoadingState from '@/components/common/LoadingState';
import PaymentMethodCard from '@/components/cards/PaymentMethodCard';
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
import { useCreateDeposit } from '@/hooks/useDepositMutations';
import { useCurrencySettings, useDepositSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  createDepositFormSchema,
  type CreateDepositFormInput,
  type CreateDepositFormValues,
} from '@/validators/deposit.validators';

import DepositPackageSelector from './DepositPackageSelector';
import ScreenshotUploader from './ScreenshotUploader';

// tasks/phase-05.md's Create Deposit Request workflow - assembles
// DepositPackageSelector/PaymentMethodCard/ScreenshotUploader, all driven by
// the same useDepositSettings() query so packages/payment methods are never
// hardcoded, and submits via useCreateDeposit().
const DepositForm = (): JSX.Element => {
  const { data: depositSettings, isLoading, isError } = useDepositSettings();
  const { data: currencySettings } = useCurrencySettings();
  const createDeposit = useCreateDeposit();

  // Two type parameters (RHF's documented pattern for a resolver whose
  // validated output differs from its input - see deposit.validators.ts):
  // defaultValues/field values are typed against the input shape
  // (`screenshot: File | null`), while onSubmit receives the resolver's
  // narrowed output shape (`screenshot: File`) with no manual cast needed.
  const form = useForm<CreateDepositFormInput, unknown, CreateDepositFormValues>({
    resolver: zodResolver(createDepositFormSchema),
    defaultValues: {
      packageAmount: 0,
      paymentMethod: '',
      senderAccountNumber: '',
      paymentReference: '',
      screenshot: null,
    },
  });

  const onSubmit = (values: CreateDepositFormValues): void => {
    createDeposit.mutate(values, { onSuccess: () => form.reset() });
  };

  const errorMessage = getErrorMessage(createDeposit.error);

  if (isLoading) {
    return <LoadingState message="Loading deposit options..." />;
  }

  if (isError || !depositSettings) {
    return (
      <FormAlert
        variant="destructive"
        message="Unable to load deposit settings. Please try again."
      />
    );
  }

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
          message={createDeposit.isSuccess ? 'Deposit request submitted successfully.' : null}
        />

        <FormField
          control={form.control}
          name="packageAmount"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DepositPackageSelector
                  packages={depositSettings.packages}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  currencySymbol={currencySettings?.currencySymbol}
                  decimalPrecision={currencySettings?.decimalPrecision}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PaymentMethodCard
                  paymentMethods={depositSettings.paymentMethods}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  companyBkashNumber={depositSettings.companyBkashNumber}
                  companyNagadNumber={depositSettings.companyNagadNumber}
                  depositInstructions={depositSettings.depositInstructions}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="senderAccountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sender account number</FormLabel>
              <FormControl>
                <Input placeholder="01712345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment reference</FormLabel>
              <FormControl>
                <Input placeholder="Transaction ID from bKash/Nagad" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="screenshot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment screenshot</FormLabel>
              <FormControl>
                <ScreenshotUploader value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={createDeposit.isPending}>
          {createDeposit.isPending ? 'Submitting...' : 'Submit deposit request'}
        </Button>
      </form>
    </Form>
  );
};

export default DepositForm;
