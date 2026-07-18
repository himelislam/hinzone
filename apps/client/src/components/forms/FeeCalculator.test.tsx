import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/render';

import FeeCalculator from './FeeCalculator';

describe('FeeCalculator', () => {
  it('shows placeholders when no amount has been entered yet', () => {
    renderWithProviders(<FeeCalculator amount={undefined} feePercentage={5} />);

    expect(screen.getByText('Fee (5%)')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('treats a zero amount the same as no amount', () => {
    renderWithProviders(<FeeCalculator amount={0} feePercentage={5} />);

    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('computes fee and net amount from the amount and fee percentage', () => {
    renderWithProviders(
      <FeeCalculator amount={1000} feePercentage={5} currencySymbol="৳" decimalPrecision={2} />,
    );

    expect(screen.getByText('৳50.00')).toBeInTheDocument();
    expect(screen.getByText('৳950.00')).toBeInTheDocument();
  });

  it('rounds to cents the same way withdrawal-fee.util.ts does', () => {
    renderWithProviders(
      <FeeCalculator
        amount={99.99}
        feePercentage={33.33}
        currencySymbol="৳"
        decimalPrecision={2}
      />,
    );

    // 99.99 * 33.33 / 100 = 33.326667 -> rounds to 33.33; 99.99 - 33.33 = 66.66.
    expect(screen.getByText('৳33.33')).toBeInTheDocument();
    expect(screen.getByText('৳66.66')).toBeInTheDocument();
  });
});
