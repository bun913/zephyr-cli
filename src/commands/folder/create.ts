/**
 * Folder create command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";
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
      const format = globalOptions.format;

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
      if (format === "json") {
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        console.log(`Created folder: ${response.data.id}`);
        console.log(`ID: ${response.data.id}`);
        if (response.data.self) {
          console.log(`URL: ${response.data.self}`);
        }
      }
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
