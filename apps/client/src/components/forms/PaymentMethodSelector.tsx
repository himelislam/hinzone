import type { JSX } from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentMethodSelectorProps {
  readonly paymentMethods: readonly string[];
  readonly value: string | undefined;
  readonly onChange: (method: string) => void;
}

// Renders the admin-configured withdrawal payment methods from Settings
// (useWithdrawalSettings()) dynamically - never a hardcoded list
// (project_rules.md's Settings System). Deliberately simpler than deposit's
// PaymentMethodCard - withdrawal has no company-account-number/instructions
// display to resolve, just a picker for which method the payout should use.
const PaymentMethodSelector = ({
  paymentMethods,
  value,
  onChange,
}: PaymentMethodSelectorProps): JSX.Element => (
  <div className="space-y-1.5">
    <Label htmlFor="withdrawal-payment-method">Payment method</Label>
    {/* value is always a defined string ('' when nothing is picked yet) -
    same controlled-for-life reasoning as DepositPackageSelector's Select. */}
    <Select value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger id="withdrawal-payment-method" className="w-full">
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
);

export default PaymentMethodSelector;
