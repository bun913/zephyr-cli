/**
 * Testexecution update command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerUpdateOptions, type TestExecutionUpdateOptions } from "./options";

/**
 * Register 'testexecution update' command
 */
export function registerUpdateCommand(parent: Command): void {
  const updateCommand = parent
    .command("update [idOrKey]")
    .description("Update a test execution")
    .addHelpText(
      "after",
      `
Examples:
  # Update a single test execution
  zephyr testexecution update CP02-E1 --status-name "Pass"

  # Update all test executions in a test cycle
  zephyr testexecution update --test-cycle CP02-R1 --status-name "Pass"
      `,
    );

  registerUpdateOptions(updateCommand).action(
    async (idOrKey: string | undefined, options: TestExecutionUpdateOptions, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        // Create API client
        const client = createClient(profile);

        // Build API parameters
        const apiParams = {
          ...(options.statusName && { statusName: options.statusName }),
          ...(options.environmentName && {
            environmentName: options.environmentName,
          }),
          ...(options.actualEndDate && { actualEndDate: options.actualEndDate }),
          ...(options.executionTime !== undefined && {
            executionTime: options.executionTime,
          }),
          ...(options.executedById && { executedById: options.executedById }),
          ...(options.assignedToId && { assignedToId: options.assignedToId }),
          ...(options.comment && { comment: options.comment }),
        };

        // Check if any update fields are provided
        if (Object.keys(apiParams).length === 0) {
          logger.error("No update fields provided");
          process.exit(1);
        }

        // Bulk update mode: update all executions in a test cycle
        if (options.testCycle) {
          if (idOrKey) {
            logger.warn(
              `Ignoring idOrKey "${idOrKey}" because --test-cycle option is specified`,
            );
          }

          logger.info(`Updating all test executions in test cycle: ${options.testCycle}`);

          // Fetch all test executions in the test cycle
          const listParams = {
            projectKey: profile.projectKey,
            testCycle: options.testCycle,
            maxResults: 1000,
            startAt: 0,
          };

          const listResponse = await client.testexecutions.listTestExecutions(listParams);
          const executions = listResponse.data.values || [];

          if (executions.length === 0) {
            logger.warn(`No test executions found in test cycle: ${options.testCycle}`);
            process.exit(0);
          }

          logger.info(`Found ${executions.length} test execution(s) to update`);

          // Update each execution
          let successCount = 0;
          let failCount = 0;
          const results: Array<{ key: string; success: boolean; error?: string }> = [];

          for (const execution of executions) {
            const executionKey = execution.key || String(execution.id);
            try {
              await client.testexecutions.updateTestExecution(executionKey, apiParams);
              logger.info(`Updated: ${executionKey}`);
              successCount++;
              results.push({ key: executionKey, success: true });
            } catch (error) {
              const errorMessage = formatError(error as Error);
              logger.error(`Failed to update ${executionKey}: ${errorMessage}`);
              failCount++;
              results.push({ key: executionKey, success: false, error: errorMessage });
            }
          }

          // Output summary
          const summary = {
            testCycle: options.testCycle,
            total: executions.length,
            success: successCount,
            failed: failCount,
            results,
          };

          console.log(JSON.stringify(summary, null, 2));

          if (failCount > 0) {
            process.exit(1);
          }
        } else {
          // Single update mode: update a specific execution
          if (!idOrKey) {
            logger.error("Either idOrKey or --test-cycle option must be provided");
            process.exit(1);
          }

          logger.info(`Updating test execution: ${idOrKey}`);

          // Update test execution
          await client.testexecutions.updateTestExecution(idOrKey, apiParams);

          logger.info(`Test execution updated successfully`);

          // Fetch and return updated execution
          const response = await client.testexecutions.getTestExecution(idOrKey);
          console.log(JSON.stringify(response.data, null, 2));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
