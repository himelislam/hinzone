import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env'), quiet: true });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_PORT: z.coerce.number().int().positive().default(5000),
  SERVER_URL: z.string().url(),
  CLIENT_URL: z.string().url(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRATION: z
    .string()
    .regex(
      /^\d+(\.\d+)?\s?(ms|s|m|h|d|w|y)$/i,
      'JWT_ACCESS_EXPIRATION must be a duration such as "15m" or "7d"',
    )
    .default('15m'),
  JWT_REFRESH_EXPIRATION: z
    .string()
    .regex(
      /^\d+(\.\d+)?\s?(ms|s|m|h|d|w|y)$/i,
      'JWT_REFRESH_EXPIRATION must be a duration such as "15m" or "7d"',
    )
    .default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  // Fallback for initial setup; superseded by the Security Settings policy once the
  // Settings module is available (same pattern as JWT_ACCESS_EXPIRATION above).
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  // Same fallback pattern - see docs/07-authentication.md #23/#24.
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  ACCOUNT_LOCK_DURATION_MINUTES: z.coerce.number().int().positive().default(15),
  PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES: z.coerce.number().int().positive().default(30),
  // Same fallback pattern - see docs/07-authentication.md #27 (10 requests/minute/IP).
  AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(1),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
  // docs/21-validation-rules.md #21 - "Maximum size should be configurable. Example: 5 MB."
  MAX_AVATAR_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(5),
  // Number of reverse-proxy hops Express should trust for X-Forwarded-For (used by
  // req.ip, which authRateLimiter keys on). Defaults to 0 (trust nothing, use the
  // direct socket peer) - the safe choice for local/direct-connection setups. A
  // production deployment behind exactly one reverse proxy (nginx, a cloud load
  // balancer) sets this to 1; setting it without an actual proxy in front would let
  // a client spoof its own X-Forwarded-For header to bypass rate limiting.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
});

type Environment = Readonly<z.infer<typeof environmentSchema>>;

const parseEnvironment = (): Environment => {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return Object.freeze(result.data);
};

export const env: Environment = parseEnvironment();
