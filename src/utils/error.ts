/**
 * Custom error classes for the CLI
 */

/**
 * Error thrown when configuration is missing or invalid
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Error thrown when API calls fail
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Format error for CLI output
 */
export function formatError(error: Error): string {
  if (error instanceof ConfigError) {
    return `Configuration Error: ${error.message}\n\nPlease check your configuration file at ~/.zephyr/config.json`;
  }

  if (error instanceof ApiError) {
    return `API Error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ""}`;
  }

  return `Error: ${error.message}`;
}
