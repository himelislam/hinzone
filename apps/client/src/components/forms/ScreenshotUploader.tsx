import type { ChangeEvent, JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';

// UX guardrails only - the server (middlewares/upload.ts's uploadConfig) is the
// real authority and re-validates independently (project_rules.md's Validation
// Rules: "Never trust frontend validation").
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface ScreenshotUploaderProps {
  readonly value: File | null;
  readonly onChange: (file: File | null) => void;
  readonly error?: string;
}

// File input + preview for the deposit payment screenshot - emits a File for
// DepositForm to submit as FormData (deposit.service.ts's createDeposit).
const ScreenshotUploader = ({ value, onChange, error }: ScreenshotUploaderProps): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Derived from `value` (the controlled File) during render rather than
  // mirrored into its own state, so an external reset of `value` (e.g.
  // form.reset()) updates the preview too without an extra render pass.
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  // Revokes the object URL created above when it's replaced or on unmount, to
  // avoid leaking memory - this effect only performs that cleanup, it never
  // sets state itself.
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
      setLocalError('Only JPG, PNG, and WEBP images are allowed.');
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

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Payment screenshot"
      />

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Payment screenshot preview"
          className="border-border h-40 w-full rounded-lg border object-contain"
        />
      ) : null}

      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload />
        {value ? 'Change screenshot' : 'Upload screenshot'}
      </Button>

      {value ? <p className="text-muted-foreground text-sm">{value.name}</p> : null}
      {displayError ? <p className="text-destructive text-sm">{displayError}</p> : null}
    </div>
  );
};

export default ScreenshotUploader;
