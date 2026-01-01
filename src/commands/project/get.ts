/**
 * Project get command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";

/**
 * Register 'project get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <idOrKey>")
    .description("Get a project by ID or key")
    .action(async (idOrKey: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching project: ${idOrKey}`);

        const client = createClient(profile);
        const response = await client.projects.getProject(idOrKey);

        logger.info(`Project found: ${response.data.key}`);
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
