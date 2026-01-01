/**
 * Testcycle list command implementation
 */

import type { Command } from "commander";
import type { TestCycle } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import {
  formatAsTable,
  outputResults,
  showPaginationInfo,
  type TableColumn,
} from "../../utils/output";
import { registerListOptions, type TestCycleListOptions } from "./options";

/**
 * Register 'testcycle list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent.command("list").description("List test cycles");

  registerListOptions(listCommand).action(async (options: TestCycleListOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      const useText = globalOptions.text || false;

      // Set logger verbosity
      setLoggerVerbose(globalOptions.verbose || false);

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Fetching test cycles for project: ${profile.projectKey}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        projectKey: profile.projectKey,
        maxResults: options.maxResults,
        startAt: options.startAt,
        ...(options.folderId !== undefined && { folderId: options.folderId }),
      };

      // Fetch test cycles
      const response = await client.testcycles.listTestCycles(apiParams);

      const testCycles = response.data.values || [];
      logger.info(`Found ${testCycles.length} test cycle(s)`);

      // Define table columns
      const columns: TableColumn<TestCycle>[] = [
        { header: "KEY", getValue: (tc) => tc.key },
        { header: "NAME", getValue: (tc) => tc.name },
        { header: "STATUS", getValue: (tc) => tc.status?.id },
        { header: "FOLDER", getValue: (tc) => tc.folder?.id },
      ];

      // Show pagination info and output results
      showPaginationInfo(!!response.data.next, options.startAt, options.maxResults);
      outputResults(testCycles, useText, (data) => formatAsTable(data as TestCycle[], columns));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
