import mongoose from 'mongoose';

import { databaseConfig } from '@/config/database';
import { toErrorMessage } from '@/shared/helpers/to-error-message';
import { logger } from '@/shared/logger';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const connectWithRetry = async (attempt = 1): Promise<void> => {
  try {
    await mongoose.connect(databaseConfig.uri, databaseConfig.options);
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    if (attempt >= databaseConfig.retry.maxAttempts) {
      logger.error('MongoDB connection failed after maximum retry attempts.', {
        attempt,
        error: toErrorMessage(error),
      });
      throw error;
    }

    const delayMs = Math.min(
      databaseConfig.retry.initialDelayMs * 2 ** (attempt - 1),
      databaseConfig.retry.maxDelayMs,
    );

    logger.warn(`MongoDB connection attempt ${attempt} failed. Retrying in ${delayMs}ms.`, {
      attempt,
      error: toErrorMessage(error),
    });

    await sleep(delayMs);
    await connectWithRetry(attempt + 1);
  }
};

export const connectDatabase = async (): Promise<void> => {
  await connectWithRetry();
};

export const isDatabaseConnected = (): boolean =>
  mongoose.connection.readyState === mongoose.ConnectionStates.connected;

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
};

mongoose.connection.on('disconnected', (): void => {
  logger.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (error: Error): void => {
  logger.error('MongoDB connection error.', { error: error.message });
});
