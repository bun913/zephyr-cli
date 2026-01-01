/**
 * Option definitions for testcycle commands
 */

import type { Command } from "commander";
import {
  type CustomFields,
  type PaginationOptions,
  registerCustomFieldOptions,
  registerPaginationOptions,
} from "../../utils/common-options";

/**
 * Type for 'testcycle list' options
 */
export interface TestCycleListOptions extends PaginationOptions {
  folderId?: number;
}

/**
 * Register options for 'testcycle list' command
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
 * Type for 'testcycle create' options
 */
export interface TestCycleCreateOptions {
  name: string;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  jiraProjectVersion?: number;
  statusName?: string;
  folderId?: number;
  ownerId?: string;
  customField?: CustomFields;
}

/**
 * Register options for 'testcycle create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--name <name>", "Test cycle name")
    .option("--description <text>", "Description of the test cycle")
    .option("--planned-start-date <date>", "Planned start date (ISO 8601 format)")
    .option("--planned-end-date <date>", "Planned end date (ISO 8601 format)")
    .option("--jira-project-version <id>", "Jira project version ID", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--jira-project-version must be a positive number");
      }
      return num;
    })
    .option("--status-name <name>", "Status name")
    .option("--folder-id <id>", "Folder ID", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--folder-id must be a positive number");
      }
      return num;
    })
    .option("--owner-id <id>", "Atlassian Account ID of the owner");

  registerCustomFieldOptions(command);

  return command;
}

/**
 * Type for 'testcycle update' options
 */
export interface TestCycleUpdateOptions {
  name?: string;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  jiraProjectVersion?: number;
  statusName?: string;
  folderId?: number;
  ownerId?: string;
  customField?: CustomFields;
}

/**
 * Register options for 'testcycle update' command
 */
export function registerUpdateOptions(command: Command): Command {
  command
    .option("--name <name>", "Test cycle name")
    .option("--description <text>", "Description of the test cycle")
    .option("--planned-start-date <date>", "Planned start date (ISO 8601 format)")
    .option("--planned-end-date <date>", "Planned end date (ISO 8601 format)")
    .option("--jira-project-version <id>", "Jira project version ID", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--jira-project-version must be a positive number");
      }
      return num;
    })
    .option("--status-name <name>", "Status name")
    .option("--folder-id <id>", "Folder ID", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--folder-id must be a positive number");
      }
      return num;
    })
    .option("--owner-id <id>", "Atlassian Account ID of the owner");

  registerCustomFieldOptions(command);

  return command;
}
