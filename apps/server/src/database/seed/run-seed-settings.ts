import { connectDatabase, disconnectDatabase } from '@/database/connection';
import { toErrorMessage } from '@/shared/helpers/to-error-message';
import { logger } from '@/shared/logger';

import { seedSettings } from './seed-settings';

// CLI entry point (pnpm run seed:settings) - kept separate from seed-settings.ts
// so the seeding logic itself stays a plain importable function, same split as
// app.ts (reusable) vs server.ts (executable) at the project root.
const runSeedSettings = async (): Promise<void> => {
  await connectDatabase();

  try {
    await seedSettings();
    logger.info('Settings seeding completed.');
  } finally {
    await disconnectDatabase();
  }
};

runSeedSettings().catch((error: unknown) => {
  logger.error('Settings seeding failed.', { error: toErrorMessage(error) });
  process.exit(1);
});
