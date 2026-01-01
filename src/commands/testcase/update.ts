/**
 * Testcase update command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { registerUpdateOptions, type TestCaseUpdateOptions } from "./options";

/**
 * Register 'testcase update' command
 */
export function registerUpdateCommand(parent: Command): void {
  const updateCommand = parent.command("update <key>").description("Update an existing test case");

  registerUpdateOptions(updateCommand).action(
    async (key: string, options: TestCaseUpdateOptions, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const format = globalOptions.format;

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Updating test case: ${key}`);

        // Create API client
        const client = createClient(profile);

        // First, fetch the current test case to merge with updates
        const currentResponse = await client.testcases.getTestCase(key);
        const currentTestCase = currentResponse.data;

        // Build update data by merging current values with provided options
        const updateData = {
          ...currentTestCase,
          ...(options.name !== undefined && { name: options.name }),
          ...(options.objective !== undefined && { objective: options.objective }),
          ...(options.precondition !== undefined && { precondition: options.precondition }),
          ...(options.estimatedTime !== undefined && { estimatedTime: options.estimatedTime }),
          ...(options.componentId !== undefined && { componentId: options.componentId }),
          ...(options.priorityName !== undefined && { priorityName: options.priorityName }),
          ...(options.statusName !== undefined && { statusName: options.statusName }),
          ...(options.folderId !== undefined && { folderId: options.folderId }),
          ...(options.ownerId !== undefined && { ownerId: options.ownerId }),
          ...(options.labels !== undefined && { labels: options.labels }),
        };

        // Update test case
        await client.testcases.updateTestCase(key, updateData);

        logger.info(`Test case updated successfully: ${key}`);

        // Output result
        if (format === "json") {
          console.log(JSON.stringify({ key, updated: true }, null, 2));
        } else {
          console.log(`Test case ${key} updated successfully`);
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
