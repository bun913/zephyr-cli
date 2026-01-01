import { Command } from "commander";
import type { TestCase } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";
import {
  formatAsTable,
  outputResults,
  showPaginationInfo,
  type TableColumn,
} from "../../utils/output";
import { registerListOptions, type TestCaseListOptions } from "./options";

/**
 * Register testcase command and subcommands
 */
export function registerTestcaseCommand(program: Command): void {
  const testcase = program.command("testcase").description("Manage test cases");

  const listCommand = testcase.command("list").description("List test cases");

  registerListOptions(listCommand).action(async (options: TestCaseListOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      const format = globalOptions.format;

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Fetching test cases for project: ${profile.projectKey}`);
      logger.debug(`Parameters: maxResults=${options.maxResults}, startAt=${options.startAt}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        projectKey: profile.projectKey,
        maxResults: options.maxResults,
        startAt: options.startAt,
        ...(options.folderId && { folderId: options.folderId }),
      };

      // Fetch test cases
      const response = await client.testcases.listTestCases(apiParams);

      const testCases = response.data.values || [];
      logger.info(`Found ${testCases.length} test case(s)`);

      // Define table columns
      const columns: TableColumn<TestCase>[] = [
        { header: "KEY", getValue: (tc) => tc.key },
        { header: "NAME", getValue: (tc) => tc.name },
        { header: "FOLDER", getValue: (tc) => tc.folder?.id },
      ];

      // Show pagination info and output results
      showPaginationInfo(!!response.data.next, options.startAt, options.maxResults);
      outputResults(testCases, format, (data) => formatAsTable(data, columns));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
