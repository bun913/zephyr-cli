import { Command } from "commander";
import type { TestCase } from "zephyr-api-client";
import { getProfile, loadConfig } from "../config/manager";
import type { GlobalOptions } from "../config/types";
import { createClient } from "../utils/client";
import { formatError } from "../utils/error";
import { logger } from "../utils/logger";

/**
 * Format test cases as text table
 */
function formatAsText(testCases: TestCase[]): string {
  if (testCases.length === 0) {
    return "No test cases found";
  }

  // Calculate column widths
  const keyWidth = Math.max(3, ...testCases.map((tc) => tc.key?.length || 0));
  const nameWidth = Math.max(4, ...testCases.map((tc) => tc.name?.length || 0));

  // Header
  const header = `${"KEY".padEnd(keyWidth)}  ${"NAME".padEnd(nameWidth)}  FOLDER`;
  const separator = "-".repeat(header.length);

  // Rows
  const rows = testCases.map((tc) => {
    const key = (tc.key || "").padEnd(keyWidth);
    const name = (tc.name || "").padEnd(nameWidth);
    const folderId = tc.folder?.id || "N/A";
    return `${key}  ${name}  ${folderId}`;
  });

  return [header, separator, ...rows].join("\n");
}

/**
 * Register testcase command and subcommands
 */
export function registerTestcaseCommand(program: Command): void {
  const testcase = program.command("testcase").description("Manage test cases");

  testcase
    .command("list")
    .description("List test cases")
    .option("--max-results <number>", "Maximum results to return (1-1000, default: 10)", "10")
    .option("--start-at <number>", "Starting position (zero-indexed, default: 0)", "0")
    .action(async (options, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;

        // Validate format option
        const format = globalOptions.format || "json";
        if (format !== "json" && format !== "text") {
          throw new Error(`Invalid format: ${format}. Must be 'json' or 'text'`);
        }

        // Validate and parse numeric options
        const maxResults = Number.parseInt(options.maxResults, 10);
        if (Number.isNaN(maxResults) || maxResults < 1 || maxResults > 1000) {
          throw new Error("Invalid --max-results. Must be a number between 1 and 1000");
        }

        const startAt = Number.parseInt(options.startAt, 10);
        if (Number.isNaN(startAt) || startAt < 0) {
          throw new Error("Invalid --start-at. Must be a non-negative number");
        }

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test cases for project: ${profile.projectKey}`);
        logger.debug(`Parameters: maxResults=${maxResults}, startAt=${startAt}`);

        // Create API client
        const client = createClient(profile);

        // Fetch test cases (simple API wrapper)
        const response = await client.testcases.listTestCases({
          projectKey: profile.projectKey,
          maxResults,
          startAt,
        });

        const testCases = response.data.values || [];
        logger.info(`Found ${testCases.length} test case(s)`);

        // Show next page info if available
        if (response.data.next) {
          logger.info(
            `More results available. Use --start-at ${startAt + maxResults} to get next page`,
          );
        }

        // Output results based on format
        if (format === "json") {
          console.log(JSON.stringify(testCases, null, 2));
        } else {
          console.log(formatAsText(testCases));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
