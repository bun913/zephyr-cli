/**
 * Testcycle get command implementation
 */

import type { Command } from "commander";
import type { TestCycle } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue } from "../../utils/output";

/**
 * Register 'testcycle get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <keyOrId>")
    .description("Get a test cycle by key or ID")
    .action(async (keyOrId: string, _options, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const useText = globalOptions.text || false;

        // Set logger verbosity
        setLoggerVerbose(globalOptions.verbose || false);

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test cycle: ${keyOrId}`);

        // Create API client
        const client = createClient(profile);

        // Fetch test cycle
        const response = await client.testcycles.getTestCycle(keyOrId);
        const testCycle = response.data;

        logger.info(`Test cycle found: ${testCycle.name}`);

        // Output result
        if (useText) {
          const fields = [
            { label: "Key:", getValue: (tc: TestCycle) => tc.key },
            { label: "Name:", getValue: (tc: TestCycle) => tc.name },
            { label: "Status:", getValue: (tc: TestCycle) => tc.status?.id },
            { label: "Folder:", getValue: (tc: TestCycle) => tc.folder?.id },
            { label: "Owner:", getValue: (tc: TestCycle) => tc.owner?.accountId },
            { label: "Planned Start:", getValue: (tc: TestCycle) => tc.plannedStartDate },
            { label: "Planned End:", getValue: (tc: TestCycle) => tc.plannedEndDate },
            { label: "Description:", getValue: (tc: TestCycle) => tc.description },
          ];
          console.log(formatAsKeyValue(testCycle, fields));
        } else {
          console.log(JSON.stringify(testCycle, null, 2));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
