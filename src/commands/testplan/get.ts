/**
 * Testplan get command implementation
 */

import type { Command } from "commander";
import type { TestPlan } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { formatAsKeyValue } from "../../utils/output";

/**
 * Register 'testplan get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <keyOrId>")
    .description("Get a test plan by key or ID")
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

        logger.info(`Fetching test plan: ${keyOrId}`);

        // Create API client
        const client = createClient(profile);

        // Fetch test plan
        const response = await client.testplans.getTestPlan(keyOrId);
        const testPlan = response.data;

        logger.info(`Test plan found: ${testPlan.name}`);

        // Output result
        if (useText) {
          const fields = [
            { label: "Key:", getValue: (tp: TestPlan) => tp.key },
            { label: "Name:", getValue: (tp: TestPlan) => tp.name },
            { label: "Status:", getValue: (tp: TestPlan) => tp.status?.id },
            { label: "Folder:", getValue: (tp: TestPlan) => tp.folder?.id },
            { label: "Owner:", getValue: (tp: TestPlan) => tp.owner?.accountId },
            { label: "Objective:", getValue: (tp: TestPlan) => tp.objective },
            { label: "Labels:", getValue: (tp: TestPlan) => tp.labels?.join(", ") },
          ];
          console.log(formatAsKeyValue(testPlan, fields));
        } else {
          console.log(JSON.stringify(testPlan, null, 2));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
