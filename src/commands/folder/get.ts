/**
 * Folder get command implementation
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";

/**
 * Register 'folder get' command
 */
export function registerGetCommand(parent: Command): void {
  parent
    .command("get <id>")
    .description("Get a folder by ID")
    .action(async (id: string, _options, command) => {
      try {
        // Get global options from parent command
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const format = globalOptions.format;

        // Parse folder ID
        const folderId = Number.parseInt(id, 10);
        if (Number.isNaN(folderId) || folderId < 1) {
          throw new Error("Folder ID must be a positive number");
        }

        // Load configuration
        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching folder: ${folderId}`);

        // Create API client
        const client = createClient(profile);

        // Fetch folder
        const response = await client.folders.getFolder(folderId);
        const folder = response.data;

        logger.info(`Folder found: ${folder.name}`);

        // Output result
        if (format === "json") {
          console.log(JSON.stringify(folder, null, 2));
        } else {
          console.log(`ID:          ${folder.id}`);
          console.log(`Name:        ${folder.name}`);
          console.log(`Type:        ${folder.folderType}`);
          console.log(`Project:     ${folder.project?.id || "N/A"}`);
          console.log(`Parent:      ${folder.parentId || "N/A"}`);
          console.log(`Index:       ${folder.index ?? "N/A"}`);
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
