/**
 * Environment list command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerListOptions, type EnvironmentListOptions } from "./options";

/**
 * Register 'environment list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent.command("list").description("List environments");

  registerListOptions(listCommand).action(async (options: EnvironmentListOptions, command) => {
    try {
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      setLoggerVerbose(globalOptions.verbose || false);

      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Fetching environments for project: ${profile.projectKey}`);

      const client = createClient(profile);
      const response = await client.environments.listEnvironments({
        projectKey: profile.projectKey,
        maxResults: options.maxResults,
        startAt: options.startAt,
      });

      const environments = response.data.values || [];
      logger.info(`Found ${environments.length} environment(s)`);
      console.log(JSON.stringify(environments, null, 2));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
