import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { MlmSettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
import SettingsSection from '@/components/common/SettingsSection';
import CommissionTable from '@/components/tables/CommissionTable';
import RankTable from '@/components/tables/RankTable';
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
import { useMlmSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  mlmSettingsFormSchema,
  type MlmSettingsFormValues,
} from '@/validators/settings.validators';

interface MlmSettingsFormProps {
  readonly settings: MlmSettings;
}

const MlmSettingsForm = ({ settings }: MlmSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<MlmSettingsFormValues>({
    resolver: zodResolver(mlmSettingsFormSchema),
    values: settings,
  });

  const onSubmit = (values: MlmSettingsFormValues): void => {
    updateSettings.mutate({ category: SettingsCategory.MLM, data: values });
  };

  return (
    <SettingsCard
      title="MLM Settings"
      description="Referral limits, commission structure, and rank requirements."
    >
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
            message={updateSettings.isSuccess ? 'MLM settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="maximumDirectReferrals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum direct referrals</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SettingsSection
            title="Commission structure"
            description="Percentage paid per level, per deposit package amount."
          >
            <FormField
              control={form.control}
              name="commissionLevels"
              render={({ field }) => (
                <CommissionTable levels={field.value} onChange={field.onChange} />
              )}
            />
          </SettingsSection>

          <SettingsSection title="Ranks" description="Requirements and reward percentage per rank.">
            <FormField
              control={form.control}
              name="ranks"
              render={({ field }) => <RankTable ranks={field.value} onChange={field.onChange} />}
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

const MlmSettingsPage = (): JSX.Element => {
  const query = useMlmSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <SettingsQueryGate query={query}>
        {(settings) => <MlmSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default MlmSettingsPage;
