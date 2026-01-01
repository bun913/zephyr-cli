/**
 * Option definitions for environment commands
 */

import type { Command } from "commander";
import {
  type PaginationOptions,
  registerPaginationOptions,
} from "../../utils/common-options";

/**
 * Type for 'environment list' options
 */
export type EnvironmentListOptions = PaginationOptions;

/**
 * Register options for 'environment list' command
 */
export function registerListOptions(command: Command): Command {
  registerPaginationOptions(command);
  return command;
}

/**
 * Type for 'environment create' options
 */
export interface EnvironmentCreateOptions {
  name: string;
  description?: string;
}

/**
 * Register options for 'environment create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--name <name>", "Environment name")
    .option("--description <text>", "Environment description");
  return command;
}

/**
 * Type for 'environment update' options
 */
export interface EnvironmentUpdateOptions {
  name?: string;
  description?: string;
}

/**
 * Register options for 'environment update' command
 */
export function registerUpdateOptions(command: Command): Command {
  command
    .option("--name <name>", "Environment name")
    .option("--description <text>", "Environment description");
  return command;
}
