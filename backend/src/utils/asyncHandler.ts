import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Express 4 does not forward rejected promises — this does. */
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
