/**
 * Testplan create command implementation
 */

import type { Command } from "commander";
import type { KeyedCreatedResource } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue, outputResults } from "../../utils/output";
import { registerCreateOptions, type TestPlanCreateOptions } from "./options";

/**
 * Register 'testplan create' command
 */
export function registerCreateCommand(parent: Command): void {
  const createCommand = parent.command("create").description("Create a new test plan");

  registerCreateOptions(createCommand).action(async (options: TestPlanCreateOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      const useText = globalOptions.text || false;

      // Set logger verbosity
      setLoggerVerbose(globalOptions.verbose || false);

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Creating test plan in project: ${profile.projectKey}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        projectKey: profile.projectKey,
        name: options.name,
        ...(options.objective && { objective: options.objective }),
        ...(options.statusName && { statusName: options.statusName }),
        ...(options.folderId !== undefined && { folderId: options.folderId }),
        ...(options.ownerId && { ownerId: options.ownerId }),
        ...(options.labels && { labels: options.labels }),
        ...(options.customField && { customFields: options.customField }),
      };

      // Create test plan
      const response = await client.testplans.createTestPlan(apiParams);

      logger.info(`Test plan created successfully`);

      // Output result
      const fields = [
        { label: "Key:", getValue: (r: KeyedCreatedResource) => r.key },
        { label: "ID:", getValue: (r: KeyedCreatedResource) => r.id },
        { label: "URL:", getValue: (r: KeyedCreatedResource) => r.self },
      ];

      outputResults(response.data, useText, (data) =>
        formatAsKeyValue(data as KeyedCreatedResource, fields),
      );
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
