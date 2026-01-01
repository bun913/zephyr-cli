/**
 * Status get command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";

/**
 * Register 'status get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <id>")
    .description("Get a status by ID")
    .action(async (id: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        const statusId = Number.parseInt(id, 10);
        if (Number.isNaN(statusId)) {
          throw new Error("Status ID must be a number");
        }

        logger.info(`Fetching status: ${statusId}`);

        const client = createClient(profile);
        const response = await client.statuses.getStatus(statusId);

        logger.info(`Status found: ${response.data.name}`);
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
