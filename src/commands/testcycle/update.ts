/**
 * Testcycle update command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue, outputResults } from "../../utils/output";
import { registerUpdateOptions, type TestCycleUpdateOptions } from "./options";

/**
 * Register 'testcycle update' command
 */
export function registerUpdateCommand(parent: Command): void {
  const updateCommand = parent
    .command("update <keyOrId>")
    .description("Update an existing test cycle");

  registerUpdateOptions(updateCommand).action(
    async (keyOrId: string, options: TestCycleUpdateOptions, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const useText = globalOptions.text || false;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Updating test cycle: ${keyOrId}`);

        // Create API client
        const client = createClient(profile);

        // First, fetch the current test cycle to merge with updates
        const currentResponse = await client.testcycles.getTestCycle(keyOrId);
        const currentTestCycle = currentResponse.data;

        // Build update data by merging current values with provided options
        const updateData = {
          ...currentTestCycle,
          ...(options.name !== undefined && { name: options.name }),
          ...(options.description !== undefined && { description: options.description }),
          ...(options.plannedStartDate !== undefined && {
            plannedStartDate: options.plannedStartDate,
          }),
          ...(options.plannedEndDate !== undefined && { plannedEndDate: options.plannedEndDate }),
          ...(options.jiraProjectVersion !== undefined && {
            jiraProjectVersion: options.jiraProjectVersion,
          }),
          ...(options.statusName !== undefined && { statusName: options.statusName }),
          ...(options.folderId !== undefined && { folderId: options.folderId }),
          ...(options.ownerId !== undefined && { ownerId: options.ownerId }),
          ...(options.customField && {
            customFields: { ...currentTestCycle.customFields, ...options.customField },
          }),
        };

        // Update test cycle
        await client.testcycles.updateTestCycle(keyOrId, updateData);

        logger.info(`Test cycle updated successfully: ${keyOrId}`);

        // Output result
        const result = { key: keyOrId, updated: true };
        const fields = [
          { label: "Key:", getValue: (r: { key: string }) => r.key },
          { label: "Updated:", getValue: () => "true" },
        ];

        outputResults(result, useText, (data) =>
          formatAsKeyValue(data as { key: string; updated: boolean }, fields),
        );
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
