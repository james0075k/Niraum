import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);
// Not using `sanitizeFilter`: it also wraps the API's own operators ($gt, $text, $in).
// Query injection is blocked earlier: Zod coerces every query input to a primitive and
// express-mongo-sanitize strips `$`/`.` keys from body, query and params.

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connects with exponential backoff (1 s, 2 s, 4 s … capped at 30 s). Mongoose itself
 * reconnects after a successful first connection; this covers the database not being
 * reachable yet at boot (container start order, Atlas cold start).
 */
export async function connectDb(uri = env.MONGODB_URI, maxAttempts = 8) {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 10 });
      logger.info({ host: mongoose.connection.host }, 'MongoDB connected');
      return;
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      const delay = Math.min(30_000, 1000 * 2 ** (attempt - 1));
      logger.warn({ err, attempt, delay }, 'MongoDB connection failed — retrying');
      await sleep(delay);
    }
  }
}

export async function disconnectDb() {
  await mongoose.connection.close();
}

export const dbState = () => (mongoose.connection.readyState === 1 ? 'up' : 'down');
