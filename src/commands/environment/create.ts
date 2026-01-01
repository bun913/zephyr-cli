/**
 * Environment create command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { registerCreateOptions, type EnvironmentCreateOptions } from "./options";

/**
 * Register 'environment create' command
 */
export function registerCreateCommand(parent: Command): void {
  const createCommand = parent.command("create").description("Create a new environment");

  registerCreateOptions(createCommand).action(async (options: EnvironmentCreateOptions, command) => {
    try {
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      setLoggerVerbose(globalOptions.verbose || false);

      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Creating environment in project: ${profile.projectKey}`);

      const client = createClient(profile);
      const response = await client.environments.createEnvironment({
        projectKey: profile.projectKey,
        name: options.name,
        ...(options.description && { description: options.description }),
      });

      logger.info(`Environment created successfully`);
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
