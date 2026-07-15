import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { GeneralSettings } from 'shared-types';

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
import { Textarea } from '@/components/ui/textarea';
import { useUpdateSettings } from '@/hooks/useSettingsMutations';
import { useGeneralSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  generalSettingsFormSchema,
  type GeneralSettingsFormValues,
} from '@/validators/settings.validators';

interface GeneralSettingsFormProps {
  readonly settings: GeneralSettings;
}

const GeneralSettingsForm = ({ settings }: GeneralSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsFormSchema),
    values: {
      platformName: settings.platformName,
      platformLogo: settings.platformLogo ?? '',
      platformEmail: settings.platformEmail,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      whatsappNumber: settings.whatsappNumber ?? '',
      maintenanceMode: settings.maintenanceMode,
      termsAndConditions: settings.termsAndConditions ?? '',
      privacyPolicy: settings.privacyPolicy ?? '',
    },
  });

  const onSubmit = (values: GeneralSettingsFormValues): void => {
    updateSettings.mutate({ category: SettingsCategory.GENERAL, data: values });
  };

  return (
    <SettingsCard title="General Settings" description="Platform identity and contact details.">
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
            message={updateSettings.isSuccess ? 'General settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="platformName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="platformLogo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform logo URL</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="platformEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Support email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Support phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsappNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenanceMode"
            render={({ field }) => (
              <ToggleSwitch
                label="Maintenance mode"
                description="Temporarily block non-admin access to the platform."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="termsAndConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms &amp; conditions</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="privacyPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Privacy policy</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
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

const GeneralSettingsPage = (): JSX.Element => {
  const query = useGeneralSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <GeneralSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default GeneralSettingsPage;
