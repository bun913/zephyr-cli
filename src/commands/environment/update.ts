/**
 * Environment update command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerUpdateOptions, type EnvironmentUpdateOptions } from "./options";

/**
 * Register 'environment update' command
 */
export function registerUpdateCommand(parent: Command): void {
  const updateCommand = parent.command("update <id>").description("Update an environment");

  registerUpdateOptions(updateCommand).action(
    async (id: string, options: EnvironmentUpdateOptions, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        const environmentId = Number.parseInt(id, 10);
        if (Number.isNaN(environmentId)) {
          throw new Error("Environment ID must be a number");
        }

        // Get current environment to preserve fields
        const client = createClient(profile);
        const current = await client.environments.getEnvironment(environmentId);

        logger.info(`Updating environment: ${environmentId}`);

        await client.environments.updateEnvironment(environmentId, {
          id: current.data.id,
          project: current.data.project,
          name: options.name || current.data.name,
          description: options.description ?? current.data.description,
          index: current.data.index,
        });

        logger.info(`Environment updated successfully`);

        // Fetch and return updated environment
        const response = await client.environments.getEnvironment(environmentId);
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    },
  );
}
