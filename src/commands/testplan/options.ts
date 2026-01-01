/**
 * Option definitions for testplan commands
 */

import type { Command } from "commander";
import {
  type CustomFields,
  type PaginationOptions,
  registerCustomFieldOptions,
  registerPaginationOptions,
} from "../../utils/common-options";

/**
 * Type for 'testplan list' options
 */
export interface TestPlanListOptions extends PaginationOptions {
  folderId?: number;
}

/**
 * Register options for 'testplan list' command
 */
export function registerListOptions(command: Command): Command {
  registerPaginationOptions(command);

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
 * Type for 'testplan create' options
 */
export interface TestPlanCreateOptions {
  name: string;
  objective?: string;
  statusName?: string;
  folderId?: number;
  ownerId?: string;
  labels?: string[];
  customField?: CustomFields;
}

/**
 * Register options for 'testplan create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--name <name>", "Test plan name")
    .option("--objective <text>", "Description of the objective")
    .option("--status-name <name>", "Status name")
    .option("--folder-id <id>", "Folder ID", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--folder-id must be a positive number");
      }
      return num;
    })
    .option("--owner-id <id>", "Atlassian Account ID of the owner")
    .option("--labels <labels>", "Comma-separated list of labels", (val) => {
      return val.split(",").map((label) => label.trim());
    });

  registerCustomFieldOptions(command);

  return command;
}

/**
 * Type for 'testplan update' options
 */
export interface TestPlanUpdateOptions {
  name?: string;
  objective?: string;
  statusName?: string;
  folderId?: number;
  ownerId?: string;
  labels?: string[];
  customField?: CustomFields;
}

/**
 * Register options for 'testplan update' command
 */
export function registerUpdateOptions(command: Command): Command {
  command
    .option("--name <name>", "Test plan name")
    .option("--objective <text>", "Description of the objective")
    .option("--status-name <name>", "Status name")
    .option("--folder-id <id>", "Folder ID", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--folder-id must be a positive number");
      }
      return num;
    })
    .option("--owner-id <id>", "Atlassian Account ID of the owner")
    .option("--labels <labels>", "Comma-separated list of labels", (val) => {
      return val.split(",").map((label) => label.trim());
    });

  registerCustomFieldOptions(command);

  return command;
}
