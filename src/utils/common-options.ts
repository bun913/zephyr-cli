/**
 * Common CLI options shared across multiple commands
 */

import type { Command } from "commander";

/**
 * Pagination options shared by list commands
 */
export interface PaginationOptions {
  maxResults: number;
  startAt: number;
}

/**
 * Register pagination options for list commands
 *
 * These options are common across all resource list operations:
 * - maxResults: Maximum number of results to return
 * - startAt: Zero-indexed starting position for pagination
 *
 * @param command - Commander.js command instance
 * @returns The command with pagination options registered
 */
export function registerPaginationOptions(command: Command): Command {
  return command
    .option(
      "--max-results <number>",
      "Maximum results to return (1-1000)",
      (val) => {
        const num = Number.parseInt(val, 10);
        if (Number.isNaN(num) || num < 1 || num > 1000) {
          throw new Error("--max-results must be a number between 1 and 1000");
        }
        return num;
      },
      10,
    )
    .option(
      "--start-at <number>",
      "Starting position (zero-indexed)",
      (val) => {
        const num = Number.parseInt(val, 10);
        if (Number.isNaN(num) || num < 0) {
          throw new Error("--start-at must be a non-negative number");
        }
        return num;
      },
      0,
    );
}
