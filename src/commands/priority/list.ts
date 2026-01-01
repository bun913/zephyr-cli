/**
 * Priority list command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { type PriorityListOptions, registerListOptions } from "./options";

/**
 * Register 'priority list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent.command("list").description("List priorities");

  registerListOptions(listCommand).action(async (options: PriorityListOptions, command) => {
    try {
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      setLoggerVerbose(globalOptions.verbose || false);

      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Fetching priorities for project: ${profile.projectKey}`);

      const client = createClient(profile);
      const response = await client.priorities.listPriorities({
        projectKey: profile.projectKey,
        maxResults: options.maxResults,
        startAt: options.startAt,
      });

      const priorities = response.data.values || [];
      logger.info(`Found ${priorities.length} priority(ies)`);
      console.log(JSON.stringify(priorities, null, 2));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
