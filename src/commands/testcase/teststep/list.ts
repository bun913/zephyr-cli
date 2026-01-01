/**
 * Teststep list command implementation
 */

import type { Command } from "commander";
import type { TestStep } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../../config/manager";
import type { GlobalOptions } from "../../../config/types";
import { createClient } from "../../../utils/client";
import { formatError } from "../../../utils/error";
import { logger, setLoggerVerbose } from "../../../utils/logger";
import {
  formatAsTable,
  outputResults,
  showPaginationInfo,
  type TableColumn,
} from "../../../utils/output";
import { registerListOptions, type TestStepListOptions } from "./options";

/**
 * Register 'testcase teststep list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent
    .command("list <testCaseKey>")
    .description("List test steps for a test case");

  registerListOptions(listCommand).action(
    async (testCaseKey: string, options: TestStepListOptions, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.parent?.opts() as GlobalOptions;
        const useText = globalOptions.text || false;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test steps for test case: ${testCaseKey}`);
        logger.debug(`Parameters: maxResults=${options.maxResults}, startAt=${options.startAt}`);

        // Create API client
        const client = createClient(profile);

        // Build API parameters
        const apiParams = {
          maxResults: options.maxResults,
          startAt: options.startAt,
        };

        // Fetch test steps
        const response = await client.testcases.getTestCaseTestSteps(testCaseKey, apiParams);

        const testSteps = response.data.values || [];
        logger.info(`Found ${testSteps.length} test step(s)`);

        // Define table columns
        const columns: TableColumn<TestStep>[] = [
          {
            header: "INDEX",
            getValue: (_ts, idx) => (idx !== undefined ? idx + 1 : "N/A"),
          },
          {
            header: "TYPE",
            getValue: (ts) => (ts.inline ? "Inline" : ts.testCase ? "Call" : "Unknown"),
          },
          {
            header: "DESCRIPTION",
            getValue: (ts) => ts.inline?.description || ts.testCase?.testCaseKey || "N/A",
          },
          {
            header: "EXPECTED RESULT",
            getValue: (ts) => ts.inline?.expectedResult || "N/A",
          },
        ];

        // Show pagination info and output results
        showPaginationInfo(!!response.data.next, options.startAt, options.maxResults);
        outputResults(testSteps, useText, (data) => formatAsTable(data as TestStep[], columns));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
