/**
 * Testcase create command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { registerCreateOptions, type TestCaseCreateOptions } from "./options";

/**
 * Register 'testcase create' command
 */
export function registerCreateCommand(parent: Command): void {
  const createCommand = parent.command("create").description("Create a new test case");

  registerCreateOptions(createCommand).action(async (options: TestCaseCreateOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      const format = globalOptions.format;

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Creating test case in project: ${profile.projectKey}`);
      logger.debug(`Test case name: ${options.name}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        projectKey: profile.projectKey,
        name: options.name,
        ...(options.objective && { objective: options.objective }),
        ...(options.precondition && { precondition: options.precondition }),
        ...(options.estimatedTime !== undefined && { estimatedTime: options.estimatedTime }),
        ...(options.componentId !== undefined && { componentId: options.componentId }),
        ...(options.priorityName && { priorityName: options.priorityName }),
        ...(options.statusName && { statusName: options.statusName }),
        ...(options.folderId !== undefined && { folderId: options.folderId }),
        ...(options.ownerId && { ownerId: options.ownerId }),
        ...(options.labels && { labels: options.labels }),
      };

      // Create test case
      const response = await client.testcases.createTestCase(apiParams);

      logger.info(`Test case created successfully`);

      // Output result
      if (format === "json") {
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        console.log(`Created test case: ${response.data.key || response.data.id}`);
        console.log(`ID: ${response.data.id}`);
        if (response.data.self) {
          console.log(`URL: ${response.data.self}`);
        }
      }
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
