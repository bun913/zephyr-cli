/**
 * Testcase get command implementation
 */

import type { Command } from "commander";
import type { TestCase } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue, outputResults } from "../../utils/output";

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

        // Output result
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

        outputResults(testCase, useText, (data) => formatAsKeyValue(data as TestCase, fields));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
