/**
 * Folder get command implementation
 */

import type { Command } from "commander";
import type { Folder } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { formatAsKeyValue, outputResults } from "../../utils/output";

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
        const useJson = globalOptions.json || false;

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
        const fields = [
          { label: "ID:", getValue: (f: Folder) => f.id },
          { label: "Name:", getValue: (f: Folder) => f.name },
          { label: "Type:", getValue: (f: Folder) => f.folderType },
          { label: "Project:", getValue: (f: Folder) => f.project?.id },
          { label: "Parent:", getValue: (f: Folder) => f.parentId },
          { label: "Index:", getValue: (f: Folder) => f.index },
        ];

        outputResults(folder, useJson, (data) => formatAsKeyValue(data as Folder, fields));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
