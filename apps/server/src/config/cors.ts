import type { CorsOptions } from 'cors';

import { env } from './environment';

export const corsOptions: CorsOptions = Object.freeze({
  origin: env.CLIENT_URL,
  credentials: true,
});
