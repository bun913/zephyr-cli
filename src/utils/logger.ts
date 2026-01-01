import pino from "pino";

/**
 * Create logger instance
 * Default level is 'error' (only show errors)
 * Set to 'info' when verbose mode is enabled
 */
export const createLogger = (verbose = false) =>
  pino({
    level: verbose ? "info" : "error",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  });

// Default logger (will be replaced per command based on verbose flag)
export let logger = createLogger(false);

/**
 * Set logger level based on verbose flag
 */
export function setLoggerVerbose(verbose: boolean): void {
  logger = createLogger(verbose);
}
