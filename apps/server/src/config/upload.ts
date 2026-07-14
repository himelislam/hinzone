import { env } from './environment';

// docs/21-validation-rules.md #21 - allowed avatar/image types.
export const uploadConfig = Object.freeze({
  maxFileSizeBytes: env.MAX_AVATAR_UPLOAD_SIZE_MB * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
});
