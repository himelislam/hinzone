import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { DepositSettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
import SettingsSection from '@/components/common/SettingsSection';
import CurrencyInput from '@/components/forms/CurrencyInput';
import StringListTextarea from '@/components/forms/StringListTextarea';
import ToggleSwitch from '@/components/forms/ToggleSwitch';
import PackageTable from '@/components/tables/PackageTable';
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
import { Textarea } from '@/components/ui/textarea';
import { useUpdateSettings } from '@/hooks/useSettingsMutations';
import { useDepositSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  cleanStringList,
  depositSettingsFormSchema,
  type DepositSettingsFormValues,
} from '@/validators/settings.validators';

interface DepositSettingsFormProps {
  readonly settings: DepositSettings;
}

const DepositSettingsForm = ({ settings }: DepositSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<DepositSettingsFormValues>({
    resolver: zodResolver(depositSettingsFormSchema),
    values: {
      enabled: settings.enabled,
      packages: settings.packages,
      minimumDeposit: settings.minimumDeposit,
      maximumDeposit: settings.maximumDeposit,
      paymentMethods: settings.paymentMethods,
      companyBkashNumber: settings.companyBkashNumber ?? '',
      companyNagadNumber: settings.companyNagadNumber ?? '',
      depositInstructions: settings.depositInstructions ?? '',
    },
  });

  const onSubmit = (values: DepositSettingsFormValues): void => {
    updateSettings.mutate({
      category: SettingsCategory.DEPOSIT,
      data: { ...values, paymentMethods: cleanStringList(values.paymentMethods) },
    });
  };

  return (
    <SettingsCard title="Deposit Settings" description="Limits, packages, and payment methods.">
      <Form {...form}>
        <form
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          className="space-y-6"
          noValidate
        >
          <FormAlert
            variant="destructive"
            message={updateSettings.isError ? getErrorMessage(updateSettings.error) : null}
          />
          <FormAlert
            variant="success"
            message={updateSettings.isSuccess ? 'Deposit settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Deposits enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <SettingsSection title="Limits">
            <FormField
              control={form.control}
              name="minimumDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum deposit</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maximumDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum deposit</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsSection>

          <SettingsSection title="Packages" description="Preset amounts admins offer for deposit.">
            <FormField
              control={form.control}
              name="packages"
              render={({ field }) => (
                <PackageTable packages={field.value} onChange={field.onChange} />
              )}
            />
          </SettingsSection>

          <SettingsSection title="Payment details">
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
            <FormField
              control={form.control}
              name="companyBkashNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company bKash number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyNagadNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Nagad number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="depositInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit instructions</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsSection>

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </Form>
    </SettingsCard>
  );
};

const DepositSettingsPage = (): JSX.Element => {
  const query = useDepositSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <DepositSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default DepositSettingsPage;
