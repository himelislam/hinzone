import type { Request, RequestHandler } from 'express';
import multer from 'multer';

import { uploadConfig } from '@/config/upload';
import { ValidationError } from '@/shared/errors';

type AllowedMimeType = (typeof uploadConfig.allowedMimeTypes)[number];

const isAllowedMimeType = (mimetype: string): mimetype is AllowedMimeType =>
  (uploadConfig.allowedMimeTypes as readonly string[]).includes(mimetype);

const fileFilter: NonNullable<multer.Options['fileFilter']> = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (!isAllowedMimeType(file.mimetype)) {
    callback(
      new ValidationError('Only JPG, PNG, and WEBP images are allowed.', [
        { path: 'image', message: 'Only JPG, PNG, and WEBP images are allowed.' },
      ]),
    );
    return;
  }

  callback(null, true);
};

// Memory storage only - per backend_rules.md #22, uploads must never touch the
// application server's disk; the buffer is streamed straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadConfig.maxFileSizeBytes },
  fileFilter,
});

export const uploadAvatar: RequestHandler = upload.single('image');
