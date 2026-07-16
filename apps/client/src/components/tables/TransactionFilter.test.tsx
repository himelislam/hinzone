import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TransactionType } from 'shared-types';

import { fireEvent, renderWithProviders, screen } from '@/test/render';

import TransactionFilter from './TransactionFilter';

describe('TransactionFilter', () => {
  it('reports a search change', () => {
    const onChange = vi.fn();

    renderWithProviders(<TransactionFilter value={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'bKash' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'bKash' }));
  });

  it('clears the search back to undefined when emptied', () => {
    const onChange = vi.fn();

    renderWithProviders(<TransactionFilter value={{ search: 'bKash' }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: undefined }));
  });

  it('reports a date-from change', () => {
    const onChange = vi.fn();

    renderWithProviders(<TransactionFilter value={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-07-01' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dateFrom: '2026-07-01' }));
  });

  it('reports a min-amount change as a number', () => {
    const onChange = vi.fn();

    renderWithProviders(<TransactionFilter value={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Min amount'), { target: { value: '50' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ minAmount: 50 }));
  });

  it('reports a type selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<TransactionFilter value={{}} onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Type' }));
    await user.click(await screen.findByRole('option', { name: 'CREDIT' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'CREDIT' }));
  });

  it('reports a sort selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<TransactionFilter value={{}} onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Highest amount' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'highestAmount' }));
  });

  it('clears a filter back to undefined when "All types" is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <TransactionFilter value={{ type: TransactionType.CREDIT }} onChange={onChange} />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Type' }));
    await user.click(await screen.findByRole('option', { name: 'All types' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: undefined }));
  });
});
