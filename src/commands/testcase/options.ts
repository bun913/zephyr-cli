/**
 * Option definitions for testcase commands
 */

import type { Command } from "commander";
import { type PaginationOptions, registerPaginationOptions } from "../../utils/common-options";

/**
 * Register options for 'testcase list' command
 */
export function registerListOptions(command: Command): Command {
  // Register common pagination options
  registerPaginationOptions(command);

  // Register testcase-specific options
  command.option("--folder-id <number>", "Folder ID filter", (val) => {
    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num) || num < 1) {
      throw new Error("--folder-id must be a positive number");
    }
    return num;
  });

  return command;
}

/**
 * Type for 'testcase list' options
 */
export interface TestCaseListOptions extends PaginationOptions {
  folderId?: number;
}
