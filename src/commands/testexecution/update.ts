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
  const updateCommand = parent.command("update <idOrKey>").description("Update a test execution");

  registerUpdateOptions(updateCommand).action(
    async (idOrKey: string, options: TestExecutionUpdateOptions, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Updating test execution: ${idOrKey}`);

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

        // Update test execution
        await client.testexecutions.updateTestExecution(idOrKey, apiParams);

        logger.info(`Test execution updated successfully`);

        // Fetch and return updated execution
        const response = await client.testexecutions.getTestExecution(idOrKey);
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
