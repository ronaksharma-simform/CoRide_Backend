import type { RequestHandler } from "express";
import { config } from "../utils/config";
import { logger } from "../utils/logger";

type Options = {
  log?: { info: (message: string) => unknown };
  enabled?: boolean;
};

// One line per finished request: method, path, status, ms. Never the body,
// headers or query string, which can carry tokens.
export const requestLogger = ({
  log = logger,
  enabled = config.app.env !== "test",
}: Options = {}): RequestHandler => {
  if (!enabled) return (_req, _res, next) => next();

  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const path = req.originalUrl.split("?")[0];
      log.info(`${req.method} ${path} ${res.statusCode} ${ms.toFixed(1)}ms`);
    });
    next();
  };
};
