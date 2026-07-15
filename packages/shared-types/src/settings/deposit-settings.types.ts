// Admins add/edit/remove packages by editing this array through the Settings API -
// never by changing code (docs/20-settings-system.md #10).
export interface DepositPackage {
  amount: number;
}

export interface DepositSettings {
  enabled: boolean;
  packages: DepositPackage[];
  minimumDeposit: number;
  maximumDeposit: number;
  paymentMethods: string[];
  companyBkashNumber?: string;
  companyNagadNumber?: string;
  depositInstructions?: string;
}
