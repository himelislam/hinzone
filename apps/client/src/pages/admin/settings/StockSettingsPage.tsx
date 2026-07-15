import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { StockSettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateSettings } from '@/hooks/useSettingsMutations';
import { useStockSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  stockSettingsFormSchema,
  type StockSettingsFormValues,
} from '@/validators/settings.validators';

interface StockSettingsFormProps {
  readonly settings: StockSettings;
}

const StockSettingsForm = ({ settings }: StockSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<StockSettingsFormValues>({
    resolver: zodResolver(stockSettingsFormSchema),
    values: settings,
  });

  const onSubmit = (values: StockSettingsFormValues): void => {
    updateSettings.mutate({ category: SettingsCategory.STOCKS, data: values });
  };

  return (
    <SettingsCard title="Stock Settings" description="Trading limits and price update behavior.">
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
            message={updateSettings.isSuccess ? 'Stock settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Stock trading enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="autoSellEnabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Auto sell enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="fractionalSharesEnabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Fractional shares enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="minimumPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum purchase</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maximumPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum purchase</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceUpdateMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price update mode</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoSellIntervalMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auto sell interval (minutes)</FormLabel>
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

const StockSettingsPage = (): JSX.Element => {
  const query = useStockSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <StockSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default StockSettingsPage;
