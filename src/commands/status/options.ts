/**
 * Option definitions for status commands
 */

import type { Command } from "commander";
import { type PaginationOptions, registerPaginationOptions } from "../../utils/common-options";

const STATUS_TYPES = ["TEST_CASE", "TEST_PLAN", "TEST_CYCLE", "TEST_EXECUTION"] as const;
type StatusType = (typeof STATUS_TYPES)[number];

/**
 * Type for 'status list' options
 */
export interface StatusListOptions extends PaginationOptions {
  statusType?: StatusType;
}

/**
 * Register options for 'status list' command
 */
export function registerListOptions(command: Command): Command {
  registerPaginationOptions(command);
  command.option(
    "--status-type <type>",
    "Filter by status type (TEST_CASE, TEST_PLAN, TEST_CYCLE, TEST_EXECUTION)",
  );
  return command;
}

/**
 * Type for 'status create' options
 */
export interface StatusCreateOptions {
  name: string;
  type: StatusType;
  description?: string;
  color?: string;
}

/**
 * Register options for 'status create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--name <name>", "Status name")
    .requiredOption(
      "--type <type>",
      "Status type (TEST_CASE, TEST_PLAN, TEST_CYCLE, TEST_EXECUTION)",
    )
    .option("--description <text>", "Status description")
    .option("--color <hex>", "Color in hexadecimal format (e.g., #FF0000)");
  return command;
}
