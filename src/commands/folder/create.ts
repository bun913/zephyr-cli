/**
 * Folder create command implementation
 */

import type { Command } from "commander";
import type { CreatedResource } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { formatAsKeyValue, outputResults } from "../../utils/output";
import { type FolderCreateOptions, registerCreateOptions } from "./options";

/**
 * Register 'folder create' command
 */
export function registerCreateCommand(parent: Command): void {
  const createCommand = parent.command("create").description("Create a new folder");

  registerCreateOptions(createCommand).action(async (options: FolderCreateOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      const useJson = globalOptions.json || false;

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info(`Creating folder in project: ${options.projectKey}`);
      logger.debug(`Folder name: ${options.name}, type: ${options.folderType}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        projectKey: options.projectKey,
        name: options.name,
        folderType: options.folderType,
        ...(options.parentId !== undefined && { parentId: options.parentId }),
      };

      // Create folder
      const response = await client.folders.createFolder(apiParams);

      logger.info("Folder created successfully");

      // Output result
      const fields = [
        { label: "ID:", getValue: (r: CreatedResource) => r.id },
        { label: "URL:", getValue: (r: CreatedResource) => r.self },
      ];

      outputResults(response.data, useJson, (data) =>
        formatAsKeyValue(data as CreatedResource, fields),
      );
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
