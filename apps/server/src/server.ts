import type { Server } from 'node:http';

import { env } from '@/config/environment';
import { connectDatabase, disconnectDatabase } from '@/database/connection';
import { settingsService } from '@/modules/settings/settings.service';
import { toErrorMessage } from '@/shared/helpers/to-error-message';
import { logger } from '@/shared/logger';

import app from './app';

const SHUTDOWN_TIMEOUT_MS = 10000;

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const shutdown = (server: Server, reason: string): void => {
  logger.info(`${reason} received. Shutting down gracefully.`);

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  const runShutdown = async (): Promise<void> => {
    try {
      await closeServer(server);
      await disconnectDatabase();
      clearTimeout(forceExitTimer);
      logger.info('Server shut down successfully.');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimer);
      logger.error('Error during graceful shutdown.', { error: toErrorMessage(error) });
      process.exit(1);
    }
  };

  void runShutdown();
};

const startServer = async (): Promise<void> => {
  await connectDatabase();

  // docs/20-settings-system.md #23 / backend_rules.md #7: settings must be cached
  // before the app starts serving requests, not lazily loaded on whichever
  // category happens to be requested first. Requires `pnpm run seed:settings` to
  // have already run at least once - an empty result here just means the cache
  // starts cold and getByCategory()'s existing lazy-load/NotFoundError fallback
  // takes over, same as it always has.
  await settingsService.warmCache();
  logger.info('Settings cache warmed.');

  const server = app.listen(env.SERVER_PORT, () => {
    logger.info(`Server listening on port ${env.SERVER_PORT}.`);
  });

  process.on('SIGTERM', () => {
    shutdown(server, 'SIGTERM');
  });

  process.on('SIGINT', () => {
    shutdown(server, 'SIGINT');
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception.', { error: error.message });
    shutdown(server, 'uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection.', { reason: toErrorMessage(reason) });
    shutdown(server, 'unhandledRejection');
  });
};

startServer().catch((error: unknown) => {
  logger.error('Failed to start server.', { error: toErrorMessage(error) });
  process.exit(1);
});
