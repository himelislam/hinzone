import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { AppError, ValidationError } from '@/shared/errors';
import { logger } from '@/shared/logger';
import { errorResponse } from '@/shared/response';

const isBodyParserSyntaxError = (
  error: unknown,
): error is SyntaxError & { readonly type: string } =>
  error instanceof SyntaxError && (error as { type?: unknown }).type === 'entity.parse.failed';

const normalizeError = (err: Error): AppError | null => {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof ZodError) {
    return new ValidationError(
      'Validation failed.',
      err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }

  // Multer's own errors (e.g. LIMIT_FILE_SIZE) are not AppError subclasses, so
  // without this they would otherwise fall through to a generic 500 instead of a
  // clear validation error.
  if (err instanceof MulterError) {
    return new ValidationError(err.message, [{ path: err.field ?? 'file', message: err.message }]);
  }

  // Defense in depth alongside shared/validators/mongo-id.validator.ts - a
  // malformed ObjectId reaching a repository lookup (findById etc.) throws this
  // instead of returning null.
  if (err instanceof mongoose.Error.CastError) {
    return new ValidationError('Invalid identifier.', [
      { path: err.path, message: 'Invalid identifier format.' },
    ]);
  }

  if (isBodyParserSyntaxError(err)) {
    return new ValidationError('Malformed JSON in request body.');
  }

  return null;
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = normalizeError(err);

  if (!appError) {
    logger.error(err);
    errorResponse(res, 'Internal server error.', 500, 'INTERNAL_SERVER_ERROR');
    return;
  }

  errorResponse(res, appError.message, appError.statusCode, appError.errorCode, appError.errors);
};
