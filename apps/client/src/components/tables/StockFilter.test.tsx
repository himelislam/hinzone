import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { StockStatus } from 'shared-types';

import { fireEvent, renderWithProviders, screen } from '@/test/render';

import StockFilter from './StockFilter';

describe('StockFilter', () => {
  it('hides the Status and Featured filters for non-admin callers', () => {
    renderWithProviders(<StockFilter value={{}} onChange={vi.fn()} />);

    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Featured')).not.toBeInTheDocument();
  });

  it('shows the Status and Featured filters when isAdmin is set', () => {
    renderWithProviders(<StockFilter value={{}} onChange={vi.fn()} isAdmin />);

    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Featured')).toBeInTheDocument();
  });

  it('hides the Category filter when no categories are provided', () => {
    renderWithProviders(<StockFilter value={{}} onChange={vi.fn()} />);

    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
  });

  it('shows the Category filter when categories are provided', () => {
    renderWithProviders(
      <StockFilter value={{}} onChange={vi.fn()} categories={['Technology', 'Finance']} />,
    );

    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('reports a search change', () => {
    const onChange = vi.fn();

    renderWithProviders(<StockFilter value={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Apple' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'Apple' }));
  });

  it('reports an industry change', () => {
    const onChange = vi.fn();

    renderWithProviders(<StockFilter value={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'Software' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ industry: 'Software' }));
  });

  it('reports a category selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <StockFilter value={{}} onChange={onChange} categories={['Technology', 'Finance']} />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.click(await screen.findByRole('option', { name: 'Finance' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ category: 'Finance' }));
  });

  it('reports a status selection when isAdmin is set', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<StockFilter value={{}} onChange={onChange} isAdmin />);

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: StockStatus.SUSPENDED }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: StockStatus.SUSPENDED }),
    );
  });

  it('clears the status filter back to undefined when "All statuses" is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <StockFilter value={{ status: StockStatus.SUSPENDED }} onChange={onChange} isAdmin />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'All statuses' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: undefined }));
  });

  it('reports a featured selection when isAdmin is set', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<StockFilter value={{}} onChange={onChange} isAdmin />);

    await user.click(screen.getByRole('combobox', { name: 'Featured' }));
    await user.click(await screen.findByRole('option', { name: 'Featured only' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ featured: true }));
  });

  it('reports a sort selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<StockFilter value={{}} onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Price (high to low)' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'priceHighToLow' }));
  });
});
