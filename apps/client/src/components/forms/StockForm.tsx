import type { JSX } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Stock } from 'shared-types';

import FormAlert from '@/components/common/FormAlert';
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
import { useCreateStock, useUpdateStock } from '@/hooks/useStockMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import { stockFormSchema, type StockFormValues } from '@/validators/stock.validators';

import StockLogoUploader from './StockLogoUploader';
import ToggleSwitch from './ToggleSwitch';

interface StockFormProps {
  // Presence decides the mode (tasks/breakdown/phase-07-tasks.md task 45 -
  // "Single component reused for both Create Stock and Edit Stock"). The
  // caller (AdminStockFormPage, Section I) fetches the stock via
  // useAdminStock(id) first when editing and passes it down here.
  readonly stock?: Stock;
  readonly onSuccess?: () => void;
}

const defaultValuesFor = (stock: Stock | undefined): StockFormValues => {
  if (!stock) {
    return {
      symbol: '',
      name: '',
      companyName: '',
      description: '',
      category: '',
      industry: '',
      currentPrice: 0,
      totalShares: 0,
      minimumPurchase: undefined,
      maximumPurchase: undefined,
      allowFractionalShares: undefined,
      dividendEnabled: false,
      featured: false,
      displayOrder: 0,
      logo: null,
    };
  }

  return {
    symbol: stock.symbol,
    name: stock.name,
    companyName: stock.companyName,
    description: stock.description,
    category: stock.category,
    industry: stock.industry,
    currentPrice: undefined,
    totalShares: stock.totalShares,
    minimumPurchase: stock.minimumPurchase,
    maximumPurchase: stock.maximumPurchase,
    allowFractionalShares: stock.allowFractionalShares,
    dividendEnabled: stock.dividendEnabled,
    featured: stock.featured,
    displayOrder: stock.displayOrder,
    logo: null,
  };
};

// tasks/phase-07.md's Admin Stock Form fields, composed via
// stock.validators.ts's stockFormSchema. `currentPrice` is only rendered in
// create mode - editing a stock's price goes through PriceUpdateForm
// instead, so it never appears here once `stock` is set. `symbol` stays
// editable in edit mode too (phase-07.md's field list), re-validated
// server-side (assertUniqueSymbol with excludeStockId).
const StockForm = ({ stock, onSuccess }: StockFormProps): JSX.Element => {
  const isEditMode = Boolean(stock);
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  const isPending = isEditMode ? updateStock.isPending : createStock.isPending;
  const mutationError = isEditMode ? updateStock.error : createStock.error;

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: defaultValuesFor(stock),
  });

  const onSubmit = (values: StockFormValues): void => {
    if (isEditMode && stock) {
      updateStock.mutate(
        {
          id: stock.id,
          payload: {
            symbol: values.symbol,
            name: values.name,
            companyName: values.companyName,
            description: values.description,
            category: values.category,
            industry: values.industry,
            totalShares: values.totalShares,
            minimumPurchase: values.minimumPurchase,
            maximumPurchase: values.maximumPurchase,
            allowFractionalShares: values.allowFractionalShares,
            dividendEnabled: values.dividendEnabled,
            featured: values.featured,
            displayOrder: values.displayOrder,
            logo: values.logo ?? undefined,
          },
        },
        { onSuccess: () => onSuccess?.() },
      );
      return;
    }

    if (values.currentPrice === undefined || values.currentPrice <= 0) {
      form.setError('currentPrice', { message: 'Current price is required.' });
      return;
    }

    createStock.mutate(
      {
        symbol: values.symbol,
        name: values.name,
        companyName: values.companyName,
        description: values.description,
        category: values.category,
        industry: values.industry,
        currentPrice: values.currentPrice,
        totalShares: values.totalShares,
        minimumPurchase: values.minimumPurchase,
        maximumPurchase: values.maximumPurchase,
        allowFractionalShares: values.allowFractionalShares,
        dividendEnabled: values.dividendEnabled,
        featured: values.featured,
        displayOrder: values.displayOrder,
        logo: values.logo ?? undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      },
    );
  };

  const errorMessage = getErrorMessage(mutationError);

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="space-y-4"
        noValidate
      >
        <FormAlert variant="destructive" message={errorMessage} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input placeholder="AAPL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company name</FormLabel>
                <FormControl>
                  <Input placeholder="Apple Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock name</FormLabel>
              <FormControl>
                <Input placeholder="Apple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Technology" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="Consumer Electronics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isEditMode ? (
          <FormField
            control={form.control}
            name="currentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const parsed = event.target.valueAsNumber;
                      field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="totalShares"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total shares</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={field.value}
                  onChange={(event) => {
                    const parsed = event.target.valueAsNumber;
                    field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="minimumPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum purchase</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Defaults from Settings"
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const parsed = event.target.valueAsNumber;
                      field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                    }}
                  />
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
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Defaults from Settings"
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const parsed = event.target.valueAsNumber;
                      field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(event) => {
                    const parsed = event.target.valueAsNumber;
                    field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowFractionalShares"
          render={({ field }) => (
            <ToggleSwitch
              label="Allow fractional shares"
              description="Defaults from Settings when left off."
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <FormField
          control={form.control}
          name="dividendEnabled"
          render={({ field }) => (
            <ToggleSwitch
              label="Dividend enabled"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <ToggleSwitch
              label="Featured"
              description="Shown on the homepage, dashboard, and investment page."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <StockLogoUploader
                  value={field.value}
                  onChange={field.onChange}
                  existingLogoUrl={stock?.logoUrl}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Saving...' : isEditMode ? 'Save changes' : 'Create stock'}
        </Button>
      </form>
    </Form>
  );
};

export default StockForm;
