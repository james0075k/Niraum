import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { RequestHandler } from 'express';

const VALID = /^[A-Za-z0-9._-]{8,64}$/;
const ids = new WeakMap<IncomingMessage, string>();

/**
 * Assigns every request an id (trusts a well-formed incoming `X-Request-Id` from the proxy),
 * echoes it in the response and hands it to pino-http so every log line carries it.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get('x-request-id');
  const id = incoming && VALID.test(incoming) ? incoming : randomUUID();
  ids.set(req, id);
  res.setHeader('X-Request-Id', id);
  next();
};

/** pino-http `genReqId`. */
export const getRequestId = (req: IncomingMessage): string => ids.get(req) ?? randomUUID();
