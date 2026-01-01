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

/**
 * Register options for 'testcase create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--name <name>", "Test case name")
    .option("--objective <text>", "Description of the objective")
    .option("--precondition <text>", "Conditions that need to be met")
    .option("--estimated-time <ms>", "Estimated duration in milliseconds", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 0) {
        throw new Error("--estimated-time must be a non-negative number");
      }
      return num;
    })
    .option("--component-id <id>", "ID of a component from Jira", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 0) {
        throw new Error("--component-id must be a non-negative number");
      }
      return num;
    })
    .option("--priority-name <name>", "Priority name")
    .option("--status-name <name>", "Status name")
    .option("--folder-id <id>", "ID of folder to place the entity within", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--folder-id must be a positive number");
      }
      return num;
    })
    .option("--owner-id <id>", "Atlassian Account ID of the Jira user")
    .option("--labels <labels>", "Comma-separated list of labels", (val) => {
      return val.split(",").map((label) => label.trim());
    });

  return command;
}

/**
 * Type for 'testcase create' options
 */
export interface TestCaseCreateOptions {
  name: string;
  objective?: string;
  precondition?: string;
  estimatedTime?: number;
  componentId?: number;
  priorityName?: string;
  statusName?: string;
  folderId?: number;
  ownerId?: string;
  labels?: string[];
}

/**
 * Register options for 'testcase update' command
 */
export function registerUpdateOptions(command: Command): Command {
  command
    .option("--name <name>", "Test case name")
    .option("--objective <text>", "Description of the objective")
    .option("--precondition <text>", "Conditions that need to be met")
    .option("--estimated-time <ms>", "Estimated duration in milliseconds", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 0) {
        throw new Error("--estimated-time must be a non-negative number");
      }
      return num;
    })
    .option("--component-id <id>", "ID of a component from Jira", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 0) {
        throw new Error("--component-id must be a non-negative number");
      }
      return num;
    })
    .option("--priority-name <name>", "Priority name")
    .option("--status-name <name>", "Status name")
    .option("--folder-id <id>", "ID of folder to place the entity within", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--folder-id must be a positive number");
      }
      return num;
    })
    .option("--owner-id <id>", "Atlassian Account ID of the Jira user")
    .option("--labels <labels>", "Comma-separated list of labels", (val) => {
      return val.split(",").map((label) => label.trim());
    });

  return command;
}

/**
 * Type for 'testcase update' options
 */
export interface TestCaseUpdateOptions {
  name?: string;
  objective?: string;
  precondition?: string;
  estimatedTime?: number;
  componentId?: number;
  priorityName?: string;
  statusName?: string;
  folderId?: number;
  ownerId?: string;
  labels?: string[];
}
