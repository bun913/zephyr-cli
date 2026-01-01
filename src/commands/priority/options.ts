/**
 * Option definitions for priority commands
 */

import type { Command } from "commander";
import { type PaginationOptions, registerPaginationOptions } from "../../utils/common-options";

/**
 * Type for 'priority list' options
 */
export type PriorityListOptions = PaginationOptions;

/**
 * Register options for 'priority list' command
 */
export function registerListOptions(command: Command): Command {
  registerPaginationOptions(command);
  return command;
}

/**
 * Type for 'priority create' options
 */
export interface PriorityCreateOptions {
  name: string;
  description?: string;
  color?: string;
}

/**
 * Register options for 'priority create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--name <name>", "Priority name")
    .option("--description <text>", "Priority description")
    .option("--color <hex>", "Color in hexadecimal format (e.g., #FF0000)");
  return command;
}
