/**
 * Option definitions for folder commands
 */

import type { Command } from "commander";
import { type PaginationOptions, registerPaginationOptions } from "../../utils/common-options";

/**
 * Register options for 'folder list' command
 */
export function registerListOptions(command: Command): Command {
  // Register common pagination options
  registerPaginationOptions(command);

  // Register folder-specific options
  command
    .option("--project-key <key>", "Jira project key filter")
    .option(
      "--folder-type <type>",
      "Folder type filter (TEST_CASE, TEST_PLAN, or TEST_CYCLE)",
      (val) => {
        const validTypes = ["TEST_CASE", "TEST_PLAN", "TEST_CYCLE"];
        if (!validTypes.includes(val)) {
          throw new Error(`--folder-type must be one of: ${validTypes.join(", ")}`);
        }
        return val;
      },
    );

  return command;
}

/**
 * Type for 'folder list' options
 */
export interface FolderListOptions extends PaginationOptions {
  projectKey?: string;
  folderType?: "TEST_CASE" | "TEST_PLAN" | "TEST_CYCLE";
}

/**
 * Register options for 'folder create' command
 */
export function registerCreateOptions(command: Command): Command {
  command
    .requiredOption("--project-key <key>", "Jira project key")
    .requiredOption("--name <name>", "Folder name")
    .requiredOption(
      "--folder-type <type>",
      "Folder type (TEST_CASE, TEST_PLAN, or TEST_CYCLE)",
      (val) => {
        const validTypes = ["TEST_CASE", "TEST_PLAN", "TEST_CYCLE"];
        if (!validTypes.includes(val)) {
          throw new Error(`--folder-type must be one of: ${validTypes.join(", ")}`);
        }
        return val;
      },
    )
    .option("--parent-id <id>", "Parent folder ID", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("--parent-id must be a positive number");
      }
      return num;
    });

  return command;
}

/**
 * Type for 'folder create' options
 */
export interface FolderCreateOptions {
  projectKey: string;
  name: string;
  folderType: "TEST_CASE" | "TEST_PLAN" | "TEST_CYCLE";
  parentId?: number;
}

/**
 * Register options for 'folder tree' command
 */
export function registerTreeOptions(command: Command): Command {
  command
    .option(
      "--max-test-cases <number>",
      "Maximum number of test cases per folder (default: 50)",
      (val) => {
        const num = Number.parseInt(val, 10);
        if (Number.isNaN(num) || num < 1) {
          throw new Error("--max-test-cases must be a positive number");
        }
        return num;
      },
      50,
    )
    .option("--all", "Fetch all test cases (may take a long time)");

  return command;
}

/**
 * Type for 'folder tree' options
 */
export interface FolderTreeOptions {
  maxTestCases: number;
  all?: boolean;
}
