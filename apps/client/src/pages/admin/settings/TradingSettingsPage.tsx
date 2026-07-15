import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { TradingSettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
import CurrencyInput from '@/components/forms/CurrencyInput';
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
import { useTradingSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  tradingSettingsFormSchema,
  type TradingSettingsFormValues,
} from '@/validators/settings.validators';

interface TradingSettingsFormProps {
  readonly settings: TradingSettings;
}

const TradingSettingsForm = ({ settings }: TradingSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<TradingSettingsFormValues>({
    resolver: zodResolver(tradingSettingsFormSchema),
    values: settings,
  });

  const onSubmit = (values: TradingSettingsFormValues): void => {
    updateSettings.mutate({ category: SettingsCategory.TRADING, data: values });
  };

  return (
    <SettingsCard title="Trading Settings" description="Market hours and demo trading.">
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
            message={updateSettings.isSuccess ? 'Trading settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Trading enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="maintenanceMode"
            render={({ field }) => (
              <ToggleSwitch
                label="Maintenance mode"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="demoTradingEnabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Demo trading enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="demoBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Demo balance</FormLabel>
                <FormControl>
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketOpenTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market open time (HH:mm)</FormLabel>
                <FormControl>
                  <Input placeholder="10:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketCloseTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market close time (HH:mm)</FormLabel>
                <FormControl>
                  <Input placeholder="16:00" {...field} />
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

const TradingSettingsPage = (): JSX.Element => {
  const query = useTradingSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <TradingSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default TradingSettingsPage;
