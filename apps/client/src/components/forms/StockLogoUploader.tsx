import type { ChangeEvent, JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';

// UX guardrails only - the server (middlewares/upload.ts's uploadStockLogo)
// is the real authority and re-validates independently (project_rules.md's
// Validation Rules: "Never trust frontend validation"). Wider than
// ScreenshotUploader's list - stock logos additionally accept SVG
// (tasks/breakdown/phase-07-tasks.md decision 5: safe here because only
// trusted admins can reach this upload, unlike a user-submitted avatar or
// deposit screenshot).
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface StockLogoUploaderProps {
  readonly value: File | null | undefined;
  readonly onChange: (file: File | null) => void;
  // Shown alongside a freshly-picked preview when no new file has been
  // chosen yet - the stock's already-uploaded logoUrl in edit mode, so the
  // admin sees what's currently live rather than a blank uploader.
  readonly existingLogoUrl?: string;
  readonly error?: string;
}

// File input + preview for a stock's logo - emits a File for StockForm to
// submit as FormData (stock.service.ts's adminCreateStock/adminUpdateStock).
// Optional (unlike ScreenshotUploader's required screenshot), so an admin
// can leave it untouched entirely.
const StockLogoUploader = ({
  value,
  onChange,
  existingLogoUrl,
  error,
}: StockLogoUploaderProps): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return (): void => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (!file) {
      onChange(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setLocalError('Only JPG, PNG, WEBP, and SVG images are allowed.');
      onChange(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError('Image must be smaller than 5MB.');
      onChange(null);
      return;
    }

    setLocalError(null);
    onChange(file);
  };

  const displayError = error ?? localError;
  const displayedPreview = previewUrl ?? existingLogoUrl;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Stock logo"
      />

      {displayedPreview ? (
        <img
          src={displayedPreview}
          alt="Stock logo preview"
          className="border-border h-24 w-24 rounded-full border object-contain"
        />
      ) : null}

      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload />
        {value ? 'Change logo' : 'Upload logo'}
      </Button>

      {value ? <p className="text-muted-foreground text-sm">{value.name}</p> : null}
      {displayError ? <p className="text-destructive text-sm">{displayError}</p> : null}
    </div>
  );
};

export default StockLogoUploader;
