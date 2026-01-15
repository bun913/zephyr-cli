/**
 * Option definitions for testexecution commands
 */

import type { Command } from "commander";
import {
  type CustomFields,
  type PaginationOptions,
  registerCustomFieldOptions,
  registerPaginationOptions,
} from "../../utils/common-options";

/**
 * Type for 'testexecution list' options
 */
export interface TestExecutionListOptions extends PaginationOptions {
  testCycle?: string;
  testCase?: string;
  actualEndDateAfter?: string;
  actualEndDateBefore?: string;
  onlyLastExecutions?: boolean;
}

/**
 * Register options for 'testexecution list' command
 */
export function registerListOptions(command: Command): Command {
  registerPaginationOptions(command);

  command
    .option("--test-cycle <key>", "Filter by test cycle key (e.g., CPG-R1)")
    .option("--test-case <key>", "Filter by test case key (e.g., CPG-T1)")
    .option("--actual-end-date-after <date>", "Filter for actual end date after (ISO 8601 format)")
    .option(
      "--actual-end-date-before <date>",
      "Filter for actual end date before (ISO 8601 format)",
    )
    .option("--only-last-executions", "Include only the last execution of each test cycle item");

  return command;
}

/**
 * Type for 'testexecution create' options
 */
export interface TestExecutionCreateOptions {
  testCaseKey: string;
  testCycleKey: string;
  statusName: string;
  environmentName?: string;
  actualEndDate?: string;
  executionTime?: number;
  executedById?: string;
  assignedToId?: string;
  comment?: string;
  customField?: CustomFields;
}

/**
 * Register options for 'testexecution create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--test-case-key <key>", "Test case key (e.g., CPG-T1)")
    .requiredOption("--test-cycle-key <key>", "Test cycle key (e.g., CPG-R1)")
    .requiredOption("--status-name <name>", "Execution status (e.g., Pass, Fail, Not Executed)")
    .option("--environment-name <name>", "Environment name")
    .option(
      "--actual-end-date <date>",
      "Actual end date (ISO 8601 format, e.g., 2024-01-01T12:00:00Z)",
    )
    .option("--execution-time <ms>", "Actual execution time in milliseconds", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 0) {
        throw new Error("--execution-time must be a non-negative number");
      }
      return num;
    })
    .option("--executed-by-id <id>", "Atlassian Account ID of executor")
    .option("--assigned-to-id <id>", "Atlassian Account ID of assignee")
    .option("--comment <text>", "Comment on the execution");

  registerCustomFieldOptions(command);

  return command;
}

/**
 * Type for 'testexecution update' options
 */
export interface TestExecutionUpdateOptions {
  testCycle?: string;
  statusName?: string;
  environmentName?: string;
  actualEndDate?: string;
  executionTime?: number;
  executedById?: string;
  assignedToId?: string;
  comment?: string;
}

/**
 * Register options for 'testexecution update' command
 */
export function registerUpdateOptions(command: Command): Command {
  command
    .option(
      "--test-cycle <key>",
      "Update all test executions in the specified test cycle (e.g., CPG-R1)",
    )
    .option("--status-name <name>", "Execution status (e.g., Pass, Fail, Not Executed)")
    .option("--environment-name <name>", "Environment name")
    .option(
      "--actual-end-date <date>",
      "Actual end date (ISO 8601 format, e.g., 2024-01-01T12:00:00Z)",
    )
    .option("--execution-time <ms>", "Actual execution time in milliseconds", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 0) {
        throw new Error("--execution-time must be a non-negative number");
      }
      return num;
    })
    .option("--executed-by-id <id>", "Atlassian Account ID of executor")
    .option("--assigned-to-id <id>", "Atlassian Account ID of assignee")
    .option("--comment <text>", "Comment on the execution");

  return command;
}
