/**
 * Environment get command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";

/**
 * Register 'environment get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <id>")
    .description("Get an environment by ID")
    .action(async (id: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        const environmentId = Number.parseInt(id, 10);
        if (Number.isNaN(environmentId)) {
          throw new Error("Environment ID must be a number");
        }

        logger.info(`Fetching environment: ${environmentId}`);

        const client = createClient(profile);
        const response = await client.environments.getEnvironment(environmentId);

        logger.info(`Environment found: ${response.data.name}`);
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
