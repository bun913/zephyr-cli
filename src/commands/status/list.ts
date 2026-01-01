/**
 * Status list command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerListOptions, type StatusListOptions } from "./options";

/**
 * Register 'status list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent.command("list").description("List statuses");

  registerListOptions(listCommand).action(async (options: StatusListOptions, command) => {
    try {
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      setLoggerVerbose(globalOptions.verbose || false);

      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Fetching statuses for project: ${profile.projectKey}`);

      const client = createClient(profile);
      const response = await client.statuses.listStatuses({
        projectKey: profile.projectKey,
        maxResults: options.maxResults,
        startAt: options.startAt,
        ...(options.statusType && { statusType: options.statusType }),
      });

      const statuses = response.data.values || [];
      logger.info(`Found ${statuses.length} status(es)`);
      console.log(JSON.stringify(statuses, null, 2));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
