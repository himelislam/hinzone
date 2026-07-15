import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { SecuritySettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
import SettingsSection from '@/components/common/SettingsSection';
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
import { useSecuritySettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  securitySettingsFormSchema,
  type SecuritySettingsFormValues,
} from '@/validators/settings.validators';

interface SecuritySettingsFormProps {
  readonly settings: SecuritySettings;
}

const SecuritySettingsForm = ({ settings }: SecuritySettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsFormSchema),
    values: settings,
  });

  const onSubmit = (values: SecuritySettingsFormValues): void => {
    updateSettings.mutate({ category: SettingsCategory.SECURITY, data: values });
  };

  return (
    <SettingsCard
      title="Security Settings"
      description="Session lifetime, login protection, and password policy."
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
            message={updateSettings.isSuccess ? 'Security settings updated successfully.' : null}
          />

          <SettingsSection title="Sessions">
            <FormField
              control={form.control}
              name="jwtAccessExpiration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access token expiration</FormLabel>
                  <FormControl>
                    <Input placeholder="15m" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jwtRefreshExpiration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh token expiration</FormLabel>
                  <FormControl>
                    <Input placeholder="7d" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sessionTimeoutMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session timeout (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="twoFactorEnabled"
              render={({ field }) => (
                <ToggleSwitch
                  label="Two-factor authentication"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </SettingsSection>

          <SettingsSection title="Login protection">
            <FormField
              control={form.control}
              name="maximumLoginAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum login attempts</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountLockDurationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account lock duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordResetTokenExpirationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password reset token expiration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsSection>

          <SettingsSection title="Password policy">
            <FormField
              control={form.control}
              name="passwordPolicy.minimumLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum length</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordPolicy.requireUppercase"
              render={({ field }) => (
                <ToggleSwitch
                  label="Require uppercase letter"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="passwordPolicy.requireLowercase"
              render={({ field }) => (
                <ToggleSwitch
                  label="Require lowercase letter"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="passwordPolicy.requireNumbers"
              render={({ field }) => (
                <ToggleSwitch
                  label="Require number"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="passwordPolicy.requireSpecialCharacters"
              render={({ field }) => (
                <ToggleSwitch
                  label="Require special character"
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

const SecuritySettingsPage = (): JSX.Element => {
  const query = useSecuritySettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <SecuritySettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default SecuritySettingsPage;
