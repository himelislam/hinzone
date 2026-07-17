import type { JSX } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentMethodCardProps {
  readonly paymentMethods: readonly string[];
  readonly value: string | undefined;
  readonly onChange: (method: string) => void;
  readonly companyBkashNumber?: string;
  readonly companyNagadNumber?: string;
  readonly depositInstructions?: string;
}

// Best-effort match from the Settings-driven paymentMethods list to the
// specific company account number that applies - DepositSettings only names
// companyBkashNumber/companyNagadNumber explicitly (no generic per-method map),
// so this bridges the two without hardcoding which methods exist.
const resolveCompanyNumber = (
  method: string | undefined,
  companyBkashNumber: string | undefined,
  companyNagadNumber: string | undefined,
): string | undefined => {
  if (!method) {
    return undefined;
  }

  const normalized = method.toLowerCase();

  if (normalized.includes('bkash')) {
    return companyBkashNumber;
  }

  if (normalized.includes('nagad')) {
    return companyNagadNumber;
  }

  return undefined;
};

// Renders the admin-configured payment methods/company account numbers/
// instructions from Settings (useDepositSettings()) dynamically - never a
// hardcoded list (project_rules.md's Settings System).
const PaymentMethodCard = ({
  paymentMethods,
  value,
  onChange,
  companyBkashNumber,
  companyNagadNumber,
  depositInstructions,
}: PaymentMethodCardProps): JSX.Element => {
  const companyNumber = resolveCompanyNumber(value, companyBkashNumber, companyNagadNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment-method">Pay via</Label>
          {/* value is always a defined string ('' when nothing is picked yet) -
          same controlled-for-life reasoning as DepositPackageSelector's Select. */}
          <Select value={value ?? ''} onValueChange={onChange}>
            <SelectTrigger id="payment-method" className="w-full">
              <SelectValue placeholder="Select a payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {companyNumber ? (
          <p className="text-sm">
            Send payment to <span className="font-medium tabular-nums">{companyNumber}</span>
          </p>
        ) : null}

        {depositInstructions ? (
          <p className="text-muted-foreground text-sm">{depositInstructions}</p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodCard;
