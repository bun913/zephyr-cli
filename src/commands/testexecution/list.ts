/**
 * Testexecution list command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerListOptions, type TestExecutionListOptions } from "./options";

/**
 * Register 'testexecution list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent.command("list").description("List test executions");

  registerListOptions(listCommand).action(async (options: TestExecutionListOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;

      // Set logger verbosity
      setLoggerVerbose(globalOptions.verbose || false);

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Fetching test executions for project: ${profile.projectKey}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        projectKey: profile.projectKey,
        maxResults: options.maxResults,
        startAt: options.startAt,
        ...(options.testCycle && { testCycle: options.testCycle }),
        ...(options.testCase && { testCase: options.testCase }),
        ...(options.actualEndDateAfter && {
          actualEndDateAfter: options.actualEndDateAfter,
        }),
        ...(options.actualEndDateBefore && {
          actualEndDateBefore: options.actualEndDateBefore,
        }),
        ...(options.onlyLastExecutions !== undefined && {
          onlyLastExecutions: options.onlyLastExecutions,
        }),
      };

      // Fetch test executions
      const response = await client.testexecutions.listTestExecutions(apiParams);
      const executions = response.data.values || [];

      logger.info(`Found ${executions.length} test execution(s)`);

      // Output results
      console.log(JSON.stringify(executions, null, 2));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
