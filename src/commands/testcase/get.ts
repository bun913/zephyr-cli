/**
 * Testcase get command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";

/**
 * Register 'testcase get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <key>")
    .description("Get a test case by key")
    .action(async (key: string, _options, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const format = globalOptions.format;

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test case: ${key}`);

        // Create API client
        const client = createClient(profile);

        // Fetch test case
        const response = await client.testcases.getTestCase(key);
        const testCase = response.data;

        logger.info(`Test case found: ${testCase.name}`);

        // Output result
        if (format === "json") {
          console.log(JSON.stringify(testCase, null, 2));
        } else {
          // Show detailed info in text format
          console.log(`Key:         ${testCase.key}`);
          console.log(`Name:        ${testCase.name}`);
          console.log(`Status:      ${testCase.status?.id || "N/A"}`);
          console.log(`Priority:    ${testCase.priority?.id || "N/A"}`);
          console.log(`Owner:       ${testCase.owner?.accountId || "N/A"}`);
          console.log(`Folder:      ${testCase.folder?.id || "N/A"}`);
          console.log(`Created:     ${testCase.createdOn || "N/A"}`);
          if (testCase.objective) {
            console.log(`Objective:   ${testCase.objective}`);
          }
          if (testCase.precondition) {
            console.log(`Precondition: ${testCase.precondition}`);
          }
          if (testCase.labels && testCase.labels.length > 0) {
            console.log(`Labels:      ${testCase.labels.join(", ")}`);
          }
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
