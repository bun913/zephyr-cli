type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (msg: string) => void;
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

let verboseMode = false;

const formatTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
};

const log = (level: LogLevel, msg: string): void => {
  const time = formatTime();
  const prefix = `[${time}] ${level.toUpperCase()}:`;

  switch (level) {
    case "debug":
    case "info":
      if (verboseMode) console.log(`${prefix} ${msg}`);
      break;
    case "warn":
      console.warn(`${prefix} ${msg}`);
      break;
    case "error":
      console.error(`${prefix} ${msg}`);
      break;
  }
};

export const logger: Logger = {
  debug: (msg: string) => log("debug", msg),
  info: (msg: string) => log("info", msg),
  warn: (msg: string) => log("warn", msg),
  error: (msg: string) => log("error", msg),
};

/**
 * Set logger level based on verbose flag
 */
export function setLoggerVerbose(verbose: boolean): void {
  verboseMode = verbose;
}
