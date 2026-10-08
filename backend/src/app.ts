import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

/** Builds the Express app without connecting to the DB (so Supertest can import it). */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/v1/health' } }));
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  const v1 = express.Router();
  v1.get('/health', (_req, res) => {
    res.json({
      data: {
        status: 'ok',
        db: mongoose.connection.readyState === 1 ? 'up' : 'down',
        uptime: process.uptime(),
      },
    });
  });
  // Feature routers mount here: v1.use('/settings', settingsRouter), v1.use('/auth', authRouter), …
  app.use('/api/v1', v1);

  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
