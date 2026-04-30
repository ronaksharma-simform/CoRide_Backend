import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const options: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),

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
