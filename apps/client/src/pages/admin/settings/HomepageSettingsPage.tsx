import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SettingsCategory } from 'shared-types';
import type { HomepageSettings } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
import SettingsCard from '@/components/common/SettingsCard';
import SettingsQueryGate from '@/components/common/SettingsQueryGate';
import StringListTextarea from '@/components/forms/StringListTextarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateSettings } from '@/hooks/useSettingsMutations';
import { useHomepageSettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';
import {
  cleanStringList,
  homepageSettingsFormSchema,
  type HomepageSettingsFormValues,
} from '@/validators/settings.validators';

interface HomepageSettingsFormProps {
  readonly settings: HomepageSettings;
}

const HomepageSettingsForm = ({ settings }: HomepageSettingsFormProps): JSX.Element => {
  const updateSettings = useUpdateSettings();
  const form = useForm<HomepageSettingsFormValues>({
    resolver: zodResolver(homepageSettingsFormSchema),
    values: {
      bannerImages: settings.bannerImages,
      announcement: settings.announcement ?? '',
      promotionalText: settings.promotionalText ?? '',
      marketNews: settings.marketNews ?? '',
      maintenanceNotice: settings.maintenanceNotice ?? '',
    },
  });

  const onSubmit = (values: HomepageSettingsFormValues): void => {
    updateSettings.mutate({
      category: SettingsCategory.HOMEPAGE,
      data: { ...values, bannerImages: cleanStringList(values.bannerImages) },
    });
  };

  return (
    <SettingsCard title="Homepage Settings" description="Public-facing homepage content.">
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
            message={updateSettings.isSuccess ? 'Homepage settings updated successfully.' : null}
          />

          <FormField
            control={form.control}
            name="bannerImages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner image URLs (one per line)</FormLabel>
                <FormControl>
                  <StringListTextarea rows={3} value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="announcement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Announcement</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="promotionalText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promotional text</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketNews"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market news</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenanceNotice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance notice</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
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

const HomepageSettingsPage = (): JSX.Element => {
  const query = useHomepageSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsQueryGate query={query}>
        {(settings) => <HomepageSettingsForm settings={settings} />}
      </SettingsQueryGate>
    </div>
  );
};

export default HomepageSettingsPage;
