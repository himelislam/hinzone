import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { NotificationSettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
import SettingsSection from '@/components/common/SettingsSection';
import ToggleSwitch from '@/components/forms/ToggleSwitch';
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { useUpdateSettings } from '@/hooks/useSettingsMutations';
import { useNotificationSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  notificationSettingsFormSchema,
  type NotificationSettingsFormValues,
} from '@/validators/settings.validators';

interface NotificationSettingsFormProps {
  readonly settings: NotificationSettings;
}

const NotificationSettingsForm = ({ settings }: NotificationSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsFormSchema),
    values: settings,
  });

  const onSubmit = (values: NotificationSettingsFormValues): void => {
    updateSettings.mutate({ category: SettingsCategory.NOTIFICATIONS, data: values });
  };

  return (
    <SettingsCard title="Notification Settings" description="Which events trigger notifications.">
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
            message={
              updateSettings.isSuccess ? 'Notification settings updated successfully.' : null
            }
          />

          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <ToggleSwitch
                label="Notifications enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <SettingsSection title="Events">
            <FormField
              control={form.control}
              name="depositNotifications"
              render={({ field }) => (
                <ToggleSwitch
                  label="Deposit notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="withdrawalNotifications"
              render={({ field }) => (
                <ToggleSwitch
                  label="Withdrawal notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="tradingNotifications"
              render={({ field }) => (
                <ToggleSwitch
                  label="Trading notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="mlmNotifications"
              render={({ field }) => (
                <ToggleSwitch
                  label="MLM notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </SettingsSection>

          <SettingsSection title="Channels">
            <FormField
              control={form.control}
              name="pushEnabled"
              render={({ field }) => (
                <ToggleSwitch
                  label="Push notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="emailEnabled"
              render={({ field }) => (
                <ToggleSwitch
                  label="Email notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="smsEnabled"
              render={({ field }) => (
                <ToggleSwitch
                  label="SMS notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
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

const NotificationSettingsPage = (): JSX.Element => {
  const query = useNotificationSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <NotificationSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default NotificationSettingsPage;
