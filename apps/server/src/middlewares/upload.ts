import type { Request, RequestHandler } from 'express';
import multer from 'multer';

import { uploadConfig } from '@/config/upload';
import { ValidationError } from '@/shared/errors';

// Human-readable labels for the rejection message below - covers every mime
// type any uploader in this app currently accepts (uploadConfig.allowedMimeTypes
// plus stock logos' extra SVG type, tasks/breakdown/phase-07-tasks.md decision 5).
const MIME_TYPE_LABELS: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'image/svg+xml': 'SVG',
};

const formatAllowedTypes = (allowedMimeTypes: readonly string[]): string => {
  const labels = allowedMimeTypes.map((type) => MIME_TYPE_LABELS[type] ?? type);

  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
};

const buildFileFilter = (
  fieldName: string,
  allowedMimeTypes: readonly string[],
): NonNullable<multer.Options['fileFilter']> => {
  return (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback): void => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const message = `Only ${formatAllowedTypes(allowedMimeTypes)} images are allowed.`;
      callback(new ValidationError(message, [{ path: fieldName, message }]));
      return;
    }

    callback(null, true);
  };
};

// tasks/breakdown/phase-07-tasks.md decision 5 - generalized so uploadAvatar/
// uploadDepositScreenshot (both user-submitted, untrusted uploads) keep their
// existing three-type allowlist unchanged, while an admin-only uploader (e.g.
// uploadStockLogo below) can accept a wider type list without widening what
// untrusted users may upload. Memory storage only - per backend_rules.md #22,
// uploads must never touch the application server's disk; the buffer is
// streamed straight to Cloudinary (shared/helpers/upload-image.ts).
export const createImageUploader = (
  fieldName: string,
  allowedMimeTypes: readonly string[],
): RequestHandler => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: uploadConfig.maxFileSizeBytes },
    fileFilter: buildFileFilter(fieldName, allowedMimeTypes),
  });

  return upload.single(fieldName);
};

export const uploadAvatar: RequestHandler = createImageUploader(
  'image',
  uploadConfig.allowedMimeTypes,
);

// tasks/phase-05.md's Deposit Screenshot Upload - same allowlist as
// uploadAvatar; only the multipart field name differs per use case (the
// destination Cloudinary folder is passed to uploadImage() at the call site,
// not here).
export const uploadDepositScreenshot: RequestHandler = createImageUploader(
  'screenshot',
  uploadConfig.allowedMimeTypes,
);

// tasks/phase-07.md - Stock Image Upload requires JPG/PNG/SVG/WEBP. Admin-only
// (only ADMIN/SUPER_ADMIN can reach the create/update stock endpoints), so
// SVG - which can embed inline <script>/event-handler payloads - is safe to
// accept here without widening what untrusted user uploads (avatar, deposit
// screenshot) may contain (tasks/breakdown/phase-07-tasks.md decision 5).
export const uploadStockLogo: RequestHandler = createImageUploader('logo', [
  ...uploadConfig.allowedMimeTypes,
  'image/svg+xml',
]);
