/**
 * Testcase get command implementation
 */

import type { Command } from "commander";
import type { TestCase, TestStep } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue, formatAsTable, type TableColumn } from "../../utils/output";

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
        const useText = globalOptions.text || false;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

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

        // Fetch test steps
        logger.info("Fetching test steps");
        const stepsResponse = await client.testcases.getTestCaseTestSteps(key, {});
        const testSteps = stepsResponse.data.values || [];

        logger.info(`Found ${testSteps.length} test step(s)`);

        // Prepare output
        if (useText) {
          // Text format: show test case info + steps table
          const fields = [
            { label: "Key:", getValue: (tc: TestCase) => tc.key },
            { label: "Name:", getValue: (tc: TestCase) => tc.name },
            { label: "Status:", getValue: (tc: TestCase) => tc.status?.id },
            { label: "Priority:", getValue: (tc: TestCase) => tc.priority?.id },
            { label: "Owner:", getValue: (tc: TestCase) => tc.owner?.accountId },
            { label: "Folder:", getValue: (tc: TestCase) => tc.folder?.id },
            { label: "Created:", getValue: (tc: TestCase) => tc.createdOn },
            { label: "Objective:", getValue: (tc: TestCase) => tc.objective },
            { label: "Precondition:", getValue: (tc: TestCase) => tc.precondition },
            { label: "Labels:", getValue: (tc: TestCase) => tc.labels?.join(", ") },
          ];

          const testCaseInfo = formatAsKeyValue(testCase, fields);

          if (testSteps.length > 0) {
            const stepColumns: TableColumn<TestStep>[] = [
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

            const stepsTable = formatAsTable(testSteps, stepColumns);
            console.log(testCaseInfo);
            console.log("\nTest Steps:");
            console.log(stepsTable);
          } else {
            console.log(testCaseInfo);
            console.log("\nNo test steps found");
          }
        } else {
          // JSON format: include steps in the output
          const result = {
            ...testCase,
            testSteps,
          };
          console.log(JSON.stringify(result, null, 2));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
