/**
 * Testexecution get command implementation
 */

import type { Command } from "commander";
import type { TestExecution } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue } from "../../utils/output";

/**
 * Register 'testexecution get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <idOrKey>")
    .description("Get a test execution by ID or key")
    .action(async (idOrKey: string, _options, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const useText = globalOptions.text || false;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test execution: ${idOrKey}`);

        // Create API client
        const client = createClient(profile);

        // Fetch test execution
        const response = await client.testexecutions.getTestExecution(idOrKey);
        const execution = response.data;

        logger.info(`Test execution found: ${execution.key}`);

        // Output result
        if (useText) {
          const fields = [
            { label: "Key:", getValue: (e: TestExecution) => e.key },
            { label: "ID:", getValue: (e: TestExecution) => e.id },
            {
              label: "Test Case:",
              getValue: (e: TestExecution) => e.testCase?.key,
            },
            {
              label: "Test Cycle:",
              getValue: (e: TestExecution) => e.testCycle?.key,
            },
            {
              label: "Status:",
              getValue: (e: TestExecution) => e.testExecutionStatus?.id,
            },
            {
              label: "Environment:",
              getValue: (e: TestExecution) => e.environment?.id,
            },
            { label: "Executed By:", getValue: (e: TestExecution) => e.executedById },
            { label: "Assigned To:", getValue: (e: TestExecution) => e.assignedToId },
            {
              label: "Execution Time:",
              getValue: (e: TestExecution) =>
                e.executionTime ? `${e.executionTime}ms` : undefined,
            },
            { label: "Comment:", getValue: (e: TestExecution) => e.comment },
          ];
          console.log(formatAsKeyValue(execution, fields));
        } else {
          console.log(JSON.stringify(execution, null, 2));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
