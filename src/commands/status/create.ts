/**
 * Status create command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerCreateOptions, type StatusCreateOptions } from "./options";

/**
 * Register 'status create' command
 */
export function registerCreateCommand(parent: Command): void {
  const createCommand = parent.command("create").description("Create a new status");

  registerCreateOptions(createCommand).action(async (options: StatusCreateOptions, command) => {
    try {
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      setLoggerVerbose(globalOptions.verbose || false);

      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Creating status in project: ${profile.projectKey}`);

      const client = createClient(profile);
      const response = await client.statuses.createStatus({
        projectKey: profile.projectKey,
        name: options.name,
        type: options.type,
        ...(options.description && { description: options.description }),
        ...(options.color && { color: options.color }),
      });

      logger.info(`Status created successfully`);
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
