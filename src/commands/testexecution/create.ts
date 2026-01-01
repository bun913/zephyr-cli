/**
 * Testexecution create command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerCreateOptions, type TestExecutionCreateOptions } from "./options";

/**
 * Register 'testexecution create' command
 */
export function registerCreateCommand(parent: Command): void {
  const createCommand = parent.command("create").description("Create a new test execution");

  registerCreateOptions(createCommand).action(
    async (options: TestExecutionCreateOptions, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Creating test execution in project: ${profile.projectKey}`);

        // Create API client
        const client = createClient(profile);

        // Build API parameters
        const apiParams = {
          projectKey: profile.projectKey,
          testCaseKey: options.testCaseKey,
          testCycleKey: options.testCycleKey,
          statusName: options.statusName,
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
          ...(options.customField && { customFields: options.customField }),
        };

        // Create test execution
        const response = await client.testexecutions.createTestExecution(apiParams);

        logger.info(`Test execution created successfully`);

        // The API returns void with a Location header, extract ID from headers
        const location = response.headers?.location;
        if (location) {
          const id = location.split("/").pop();
          console.log(
            JSON.stringify(
              {
                id: id ? Number.parseInt(id, 10) : undefined,
                self: location,
              },
              null,
              2,
            ),
          );
        } else {
          console.log(JSON.stringify({ success: true }, null, 2));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
