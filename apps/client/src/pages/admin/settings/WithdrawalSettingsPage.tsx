import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { WithdrawalSettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
import CurrencyInput from '@/components/forms/CurrencyInput';
import StringListTextarea from '@/components/forms/StringListTextarea';
import ToggleSwitch from '@/components/forms/ToggleSwitch';
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
import { useUpdateSettings } from '@/hooks/useSettingsMutations';
import { useWithdrawalSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  cleanStringList,
  withdrawalSettingsFormSchema,
  type WithdrawalSettingsFormValues,
} from '@/validators/settings.validators';

interface WithdrawalSettingsFormProps {
  readonly settings: WithdrawalSettings;
}

const WithdrawalSettingsForm = ({ settings }: WithdrawalSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<WithdrawalSettingsFormValues>({
    resolver: zodResolver(withdrawalSettingsFormSchema),
    values: settings,
  });

  const onSubmit = (values: WithdrawalSettingsFormValues): void => {
    updateSettings.mutate({
      category: SettingsCategory.WITHDRAWAL,
      data: { ...values, paymentMethods: cleanStringList(values.paymentMethods) },
    });
  };

  return (
    <SettingsCard title="Withdrawal Settings" description="Limits, fees, and processing time.">
      <Form {...form}>
        <form
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          className="space-y-4"
          noValidate
        >
          <FormAlert
            variant="destructive"
            message={updateSettings.isError ? getErrorMessage(updateSettings.error) : null}
          />
          <FormAlert
            variant="success"
            message={updateSettings.isSuccess ? 'Withdrawal settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Withdrawals enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="minimumWithdrawal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum withdrawal</FormLabel>
                <FormControl>
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maximumWithdrawal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum withdrawal</FormLabel>
                <FormControl>
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waitingPeriodDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waiting period (days)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="withdrawalFeePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Withdrawal fee (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="processingTimeHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing time (hours)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethods"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment methods (one per line)</FormLabel>
                <FormControl>
                  <StringListTextarea rows={3} value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </Form>
    </SettingsCard>
  );
};

const WithdrawalSettingsPage = (): JSX.Element => {
  const query = useWithdrawalSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <WithdrawalSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default WithdrawalSettingsPage;
