import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import type { Stock } from 'shared-types';

import StockPriceCard from '@/components/cards/StockPriceCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useUpdateStockPrice } from '@/hooks/useStockMutations';
import { getErrorMessage } from '@/utils/get-error-message';
import { priceUpdateFormSchema, type PriceUpdateFormValues } from '@/validators/stock.validators';

interface PriceUpdateFormProps {
  readonly stock: Stock;
  readonly trigger: ReactNode;
}

// Small form (new price input) shown inside the shared ConfirmDialog - not a
// new confirmation component (tasks/breakdown/phase-07-tasks.md task 46).
// Self-contained: owns its own open state, mutation, and Settings lookup, so
// the admin stock detail page (Section I) only needs to render
// `<PriceUpdateForm stock={stock} trigger={<Button>Update price</Button>} />`.
// Live-previews change/percentageChange using the exact formula
// stock-lifecycle.service.ts's updatePrice computes server-side - same
// "instant UX feedback, server response stays authoritative" split
// FeeCalculator.tsx established in Phase 06; the server re-derives both
// figures independently rather than trusting anything sent from here.
const PriceUpdateForm = ({ stock, trigger }: PriceUpdateFormProps): JSX.Element => {
  const [open, setOpen] = useState(false);
  const { data: currencySettings } = useCurrencySettings();
  const updateStockPrice = useUpdateStockPrice();

  const form = useForm<PriceUpdateFormValues>({
    resolver: zodResolver(priceUpdateFormSchema),
    defaultValues: { newPrice: stock.currentPrice },
  });

  // useWatch(), not form.watch() - watch() returns a plain function React
  // Compiler can't safely memoize (it would skip memoizing this whole
  // component and risk stale UI); useWatch() is the hook-based,
  // compiler-safe equivalent, same fix WithdrawalForm.tsx's FeeCalculator
  // live-preview already established.
  const newPrice = useWatch({ control: form.control, name: 'newPrice' });
  const change = Number.isFinite(newPrice) ? newPrice - stock.currentPrice : 0;
  const percentageChange =
    stock.currentPrice === 0 || !Number.isFinite(newPrice)
      ? 0
      : (change / stock.currentPrice) * 100;

  const handleOpenChange = (next: boolean): void => {
    setOpen(next);

    if (next) {
      form.reset({ newPrice: stock.currentPrice });
      updateStockPrice.reset();
    }
  };

  const submit = (): void => {
    void form.handleSubmit((values) => {
      updateStockPrice.mutate(
        { id: stock.id, payload: { newPrice: values.newPrice } },
        { onSuccess: () => setOpen(false) },
      );
    })();
  };

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Update price"
      description={`Set a new price for ${stock.symbol}.`}
      confirmLabel="Update price"
      onConfirm={submit}
      isConfirming={updateStockPrice.isPending}
      open={open}
      onOpenChange={handleOpenChange}
      error={getErrorMessage(updateStockPrice.error)}
    >
      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="newPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New price</FormLabel>
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

          {/* Reuses StockPriceCard (task 40's explicit "admin price-update
              confirmation view" reuse) with its props remapped: the headline
              figure becomes the proposed new price rather than the stock's
              stored currentPrice, "Previous" becomes the stock's actual
              current price rather than its own previousPrice - the same
              up/down-styled delta display applies either way. */}
          <StockPriceCard
            currentPrice={Number.isFinite(newPrice) ? newPrice : stock.currentPrice}
            previousPrice={stock.currentPrice}
            dailyChange={change}
            dailyChangePercentage={percentageChange}
            currencySymbol={currencySettings?.currencySymbol}
            decimalPrecision={currencySettings?.decimalPrecision}
          />
        </form>
      </Form>
    </ConfirmDialog>
  );
};

export default PriceUpdateForm;
