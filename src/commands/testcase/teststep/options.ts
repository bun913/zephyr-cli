/**
 * Options for teststep commands
 */

import type { Command } from "commander";
import { registerPaginationOptions } from "../../../utils/common-options";

/**
 * Options for 'testcase teststep list' command
 */
export interface TestStepListOptions {
  maxResults: number;
  startAt: number;
}

/**
 * Register options for 'testcase teststep list' command
 */
export function registerListOptions(command: Command): Command {
  registerPaginationOptions(command);
  return command;
}

/**
 * Options for 'testcase teststep create' command
 */
export interface TestStepCreateOptions {
  mode: "APPEND" | "OVERWRITE";
  inline?: string;
  testCaseKey?: string;
}

/**
 * Register options for 'testcase teststep create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .option(
      "--mode <mode>",
      "Mode: APPEND (add to existing steps) or OVERWRITE (replace all steps)",
      "APPEND",
    )
    .option("--inline <description>", "Inline step description")
    .option("--test-case-key <key>", "Test case key to delegate execution to");

  return command;
}
