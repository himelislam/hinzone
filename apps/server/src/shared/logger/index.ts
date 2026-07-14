import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';

import { env } from '@/config/environment';
import { loggerConfig } from '@/config/logger';

const LOGS_DIRECTORY = path.resolve(__dirname, '../../../logs');

fs.mkdirSync(LOGS_DIRECTORY, { recursive: true });

const SENSITIVE_KEY_PATTERNS = ['password', 'jwt', 'token', 'secret', 'authorization'];
const REDACTED_VALUE = '[REDACTED]';

const isSensitiveKey = (key: string): boolean => {
  const normalizedKey = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalizedKey.includes(pattern));
};

const redactSensitiveData = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => redactSensitiveData(item));
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    return Object.fromEntries(
      entries.map(([key, entryValue]) => [
        key,
        isSensitiveKey(key) ? REDACTED_VALUE : redactSensitiveData(entryValue),
      ]),
    );
  }

  return value;
};

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const redactFormat = winston.format(
  (info: winston.Logform.TransformableInfo): winston.Logform.TransformableInfo => {
    for (const key of Object.keys(info)) {
      const value = (info as Record<string, unknown>)[key];
      (info as Record<string, unknown>)[key] = isSensitiveKey(key)
        ? REDACTED_VALUE
        : redactSensitiveData(value);
    }

    return info;
  },
)();

const BASE_INFO_KEYS = new Set(['level', 'message', 'timestamp', 'stack']);

const developmentFormat = combine(
  redactFormat,
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf((info: winston.Logform.TransformableInfo): string => {
    const meta = Object.fromEntries(
      Object.entries(info).filter(([key]) => !BASE_INFO_KEYS.has(key)),
    );
    const metaSuffix = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const rawMessage: unknown = info.stack ?? info.message;
    const displayMessage = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);

    return `${String(info.timestamp)} [${info.level}]: ${displayMessage}${metaSuffix}`;
  }),
);

const productionFormat = combine(redactFormat, timestamp(), errors({ stack: true }), json());

export const logger: winston.Logger = winston.createLogger({
  level: loggerConfig.level,
  format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(LOGS_DIRECTORY, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(LOGS_DIRECTORY, 'combined.log'),
    }),
  ],
  exitOnError: false,
});

export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

logger.info('Logger initialized.');
