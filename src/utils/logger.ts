import pino from "pino";
import { config } from "./config";

const isProd = config.app.env === "production";

const options: pino.LoggerOptions = {
  level: config.app.logLevel,

  base: {
    service: "backend-service",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: ["req.headers.authorization", "password"],
};

if (!isProd) {
  options.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(options);
