/**
 * Testplan list command implementation
 */

import type { Command } from "commander";
import type { TestPlan } from "zephyr-api-client";
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
import { registerListOptions, type TestPlanListOptions } from "./options";

/**
 * Register 'testplan list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent.command("list").description("List test plans");

  registerListOptions(listCommand).action(async (options: TestPlanListOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      const useText = globalOptions.text || false;

      // Set logger verbosity
      setLoggerVerbose(globalOptions.verbose || false);

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Fetching test plans for project: ${profile.projectKey}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        projectKey: profile.projectKey,
        maxResults: options.maxResults,
        startAt: options.startAt,
        ...(options.folderId !== undefined && { folderId: options.folderId }),
      };

      // Fetch test plans
      const response = await client.testplans.listTestPlans(apiParams);

      const testPlans = response.data.values || [];
      logger.info(`Found ${testPlans.length} test plan(s)`);

      // Define table columns
      const columns: TableColumn<TestPlan>[] = [
        { header: "KEY", getValue: (tp) => tp.key },
        { header: "NAME", getValue: (tp) => tp.name },
        { header: "STATUS", getValue: (tp) => tp.status?.id },
        { header: "FOLDER", getValue: (tp) => tp.folder?.id },
      ];

      // Show pagination info and output results
      showPaginationInfo(!!response.data.next, options.startAt, options.maxResults);
      outputResults(testPlans, useText, (data) => formatAsTable(data as TestPlan[], columns));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
