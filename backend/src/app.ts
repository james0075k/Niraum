import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';
import { allowedOrigins, env, isProd } from './config/env.js';
import { logger } from './config/logger.js';
import { mountDocs } from './docs/openapi.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { originCheck } from './middlewares/originCheck.js';
import { createRateLimiters } from './middlewares/rateLimits.js';
import { getRequestId, requestId } from './middlewares/requestId.js';
import { createApiRouter } from './routes/index.js';

/**
 * Builds the Express app without connecting to the DB (so Supertest can import it).
 * Middleware order: requestId → pino-http → helmet → cors → compression → json →
 * cookie-parser → mongo-sanitize → hpp → rate limits → routes → 404 → errorHandler.
 */
export function createApp(): Express {
  const app = express();
  const limits = createRateLimiters();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.set('etag', false); // explicit ETags only (settings)

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: getRequestId,
      autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
      },
    }),
  );

  // The API only returns JSON, so the CSP forbids everything; Swagger UI gets its own below.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
      strictTransportSecurity: isProd
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      exposedHeaders: ['X-Request-Id', 'ETag', 'RateLimit', 'RateLimit-Policy'],
      maxAge: 600,
    }),
  );
  app.use(originCheck);
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use('/api', limits.global);

  // OpenAPI spec + Swagger UI outside production only.
  if (!isProd) mountDocs(app);

  app.use('/api/v1', createApiRouter(limits));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
