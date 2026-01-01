/**
 * Project list command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";

/**
 * Register 'project list' command
 */
export function registerListCommand(parent: Command): void {
  parent
    .command("list")
    .description("List all projects")
    .option("--max-results <number>", "Maximum results to return", "10")
    .option("--start-at <number>", "Starting position", "0")
    .action(async (options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info("Fetching projects");

        const client = createClient(profile);
        const response = await client.projects.listProjects({
          maxResults: Number.parseInt(options.maxResults, 10),
          startAt: Number.parseInt(options.startAt, 10),
        });

        const projects = response.data.values || [];
        logger.info(`Found ${projects.length} project(s)`);
        console.log(JSON.stringify(projects, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
