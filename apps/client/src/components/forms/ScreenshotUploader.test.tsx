import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import { fireEvent, renderWithProviders, screen } from '@/test/render';

import ScreenshotUploader from './ScreenshotUploader';

const buildFile = (name: string, type: string, sizeBytes: number): File =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('ScreenshotUploader', () => {
  it('accepts a valid image and emits it via onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = buildFile('screenshot.jpg', 'image/jpeg', 1024);

    renderWithProviders(<ScreenshotUploader value={null} onChange={onChange} />);

    await user.upload(screen.getByLabelText('Payment screenshot'), file);

    expect(onChange).toHaveBeenCalledWith(file);
  });

  // The input's `accept` attribute makes userEvent.upload() simulate a real
  // browser file picker, which silently refuses to attach a non-matching file
  // (it never reaches the change handler at all) - fireEvent.change() bypasses
  // that simulated picker to actually exercise handleFileChange's own MIME
  // check, the same defense-in-depth path a drag-and-drop upload (which isn't
  // filtered by `accept`) would hit.
  it('rejects a disallowed MIME type without calling onChange with a file', () => {
    const onChange = vi.fn();
    const file = buildFile('document.pdf', 'application/pdf', 1024);

    renderWithProviders(<ScreenshotUploader value={null} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Payment screenshot'), { target: { files: [file] } });

    expect(screen.getByText('Only JPG, PNG, and WEBP images are allowed.')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('rejects a file larger than 5MB without calling onChange with a file', () => {
    const onChange = vi.fn();
    const file = buildFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024);

    renderWithProviders(<ScreenshotUploader value={null} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Payment screenshot'), { target: { files: [file] } });

    expect(screen.getByText('Image must be smaller than 5MB.')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows a server-provided error message even without a local validation failure', () => {
    renderWithProviders(
      <ScreenshotUploader
        value={null}
        onChange={vi.fn()}
        error="A payment screenshot is required."
      />,
    );

    expect(screen.getByText('A payment screenshot is required.')).toBeInTheDocument();
  });
});
