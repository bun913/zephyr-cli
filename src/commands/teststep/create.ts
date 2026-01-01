/**
 * Teststep create command implementation
 */

import type { Command } from "commander";
import type { CreatedResource } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue, outputResults } from "../../utils/output";
import { registerCreateOptions, type TestStepCreateOptions } from "./options";

/**
 * Register 'teststep create' command
 */
export function registerCreateCommand(parent: Command): void {
  const createCommand = parent
    .command("create <testCaseKey>")
    .description("Create test steps for a test case");

  registerCreateOptions(createCommand).action(
    async (testCaseKey: string, options: TestStepCreateOptions, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const useText = globalOptions.text || false;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Creating test steps for test case: ${testCaseKey}`);
        logger.debug(`Mode: ${options.mode}`);

        // Validate that either inline or testCaseKey is provided
        if (!options.inline && !options.testCaseKey) {
          throw new Error("Either --inline or --test-case-key must be provided");
        }

        if (options.inline && options.testCaseKey) {
          throw new Error("Only one of --inline or --test-case-key can be provided");
        }

        // Create API client
        const client = createClient(profile);

        // Build test step item
        const testStep = options.inline
          ? {
              inline: {
                description: options.inline,
                ...(options.expectedResult && { expectedResult: options.expectedResult }),
                ...(options.testData && { testData: options.testData }),
                ...(options.customField && { customFields: options.customField }),
              },
            }
          : {
              testCase: {
                testCaseKey: options.testCaseKey as string,
              },
            };

        // Build API parameters
        const apiParams = {
          mode: options.mode,
          items: [testStep],
        };

        // Create test steps
        const response = await client.testcases.createTestCaseTestSteps(testCaseKey, apiParams);

        logger.info("Test step created successfully");

        // Output result
        const fields = [
          { label: "ID:", getValue: (r: CreatedResource) => r.id },
          { label: "URL:", getValue: (r: CreatedResource) => r.self },
        ];

        outputResults(response.data, useText, (data) =>
          formatAsKeyValue(data as CreatedResource, fields),
        );
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
