import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

export async function connectDb(uri = env.MONGODB_URI) {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 10 });
  logger.info({ host: mongoose.connection.host }, 'MongoDB connected');
}

export async function disconnectDb() {
  await mongoose.connection.close();
}
