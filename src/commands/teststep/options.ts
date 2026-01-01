/**
 * Options for teststep commands
 */

import type { Command } from "commander";
import {
  type CustomFields,
  registerCustomFieldOptions,
  registerPaginationOptions,
} from "../../utils/common-options";

/**
 * Options for 'teststep list' command
 */
export interface TestStepListOptions {
  maxResults: number;
  startAt: number;
}

/**
 * Register options for 'teststep list' command
 */
export function registerListOptions(command: Command): Command {
  registerPaginationOptions(command);
  return command;
}

/**
 * Options for 'teststep create' command
 */
export interface TestStepCreateOptions {
  mode: "APPEND" | "OVERWRITE";
  inline?: string;
  expectedResult?: string;
  testData?: string;
  testCaseKey?: string;
  customField?: CustomFields;
}

/**
 * Register options for 'teststep create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .option(
      "--mode <mode>",
      "Mode: APPEND (add to existing steps) or OVERWRITE (replace all steps)",
      "APPEND",
    )
    .option("--inline <description>", "Inline step description")
    .option("--expected-result <text>", "Expected result for inline step")
    .option("--test-data <text>", "Test data for inline step")
    .option("--test-case-key <key>", "Test case key to delegate execution to");

  registerCustomFieldOptions(command);

  return command;
}
