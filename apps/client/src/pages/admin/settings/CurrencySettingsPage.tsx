import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { CurrencySettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
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
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  currencySettingsFormSchema,
  type CurrencySettingsFormValues,
} from '@/validators/settings.validators';

interface CurrencySettingsFormProps {
  readonly settings: CurrencySettings;
}

const CurrencySettingsForm = ({ settings }: CurrencySettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<CurrencySettingsFormValues>({
    resolver: zodResolver(currencySettingsFormSchema),
    values: settings,
  });

  const onSubmit = (values: CurrencySettingsFormValues): void => {
    updateSettings.mutate({ category: SettingsCategory.CURRENCY, data: values });
  };

  return (
    <SettingsCard
      title="Currency Settings"
      description="Base currency and exchange rates used across the platform."
    >
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
            message={updateSettings.isSuccess ? 'Currency settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default currency</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currencySymbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency symbol</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usdToBdtRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USD &rarr; BDT rate</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bdtToUsdRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BDT &rarr; USD rate</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="decimalPrecision"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decimal precision</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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

const CurrencySettingsPage = (): JSX.Element => {
  const query = useCurrencySettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <CurrencySettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default CurrencySettingsPage;
