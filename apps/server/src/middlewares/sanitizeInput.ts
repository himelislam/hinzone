import type { NextFunction, Request, Response } from 'express';

// Fields that hold secrets rather than displayable text. HTML-stripping a password
// would silently change its value (e.g. a stray "<" gets removed), which would
// corrupt the password a user actually chose - and matching a hash/token field
// never needs HTML sanitization either. Mongo-operator key stripping below still
// applies to these fields; only the HTML/XSS value pass skips them.
const SECRET_FIELD_NAMES = new Set([
  'password',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'confirmNewPassword',
  'token',
  'refreshToken',
  'accessToken',
  'resetToken',
]);

// Matches an opening/closing tag ("<" or "</" immediately followed by a letter, or
// "<!" for comments/DOCTYPE) rather than any bare "<...>" - a naive `/<[^>]*>/`
// would wrongly eat legitimate text like "5 < 10 and 10 > 5" by treating the
// stretch between the two operators as a fake tag. Deliberately dependency-free:
// the `sanitize-html` package's current release requires htmlparser2 >=9, which
// ships ESM-only and throws immediately when required under this project's
// CommonJS build - request fields here are plain form values (names, messages,
// remarks), never rich text, so a full HTML parser buys nothing a tag-stripping
// regex doesn't already cover for this "strip everything" use case.
const HTML_TAG_PATTERN = /<\/?[a-zA-Z!][^<>]*>/g;

const stripHtml = (value: string): string => value.replace(HTML_TAG_PATTERN, '');

// MongoDB operator injection: a key like "$gt" or "profile.role" reaching a query
// filter unsanitized (per docs/21-validation-rules.md #27).
const isDangerousKey = (key: string): boolean => key.startsWith('$') || key.includes('.');

const sanitizeValue = (value: unknown, key: string): unknown => {
  if (typeof value === 'string') {
    return SECRET_FIELD_NAMES.has(key) ? value : stripHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
};

const sanitizeObject = (input: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (isDangerousKey(key)) {
      continue;
    }

    sanitized[key] = sanitizeValue(value, key);
  }

  return sanitized;
};

// Mutates the target's own properties instead of reassigning req.query/req.params -
// Express 5 defines req.query as a getter with no setter, so `req.query = ...`
// throws (see middlewares/validate.ts for the same constraint).
const replaceInPlace = (target: Record<string, unknown>, source: Record<string, unknown>): void => {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // req.body may be a top-level array (not just an object) for any future
  // array-bodied endpoint - sanitizeValue's own array branch handles that
  // correctly (sanitizeObject would instead treat indices as keys and silently
  // turn the array into a plain object).
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body, '');
  }

  if (req.query && typeof req.query === 'object') {
    replaceInPlace(req.query, sanitizeObject(req.query));
  }

  if (req.params && typeof req.params === 'object') {
    replaceInPlace(req.params, sanitizeObject(req.params));
  }

  next();
};
