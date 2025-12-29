import pino from "pino";

/**
 * Logger instance for the CLI
 * Configured with pino-pretty for human-readable output
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
});
