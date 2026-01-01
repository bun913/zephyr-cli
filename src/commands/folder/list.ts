/**
 * Folder list command implementation
 */

import type { Command } from "commander";
import type { Folder } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import {
  formatAsTable,
  outputResults,
  showPaginationInfo,
  type TableColumn,
} from "../../utils/output";
import { type FolderListOptions, registerListOptions } from "./options";

/**
 * Register 'folder list' command
 */
export function registerListCommand(parent: Command): void {
  const listCommand = parent.command("list").description("List folders");

  registerListOptions(listCommand).action(async (options: FolderListOptions, command) => {
    try {
      // Get global options from parent command
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      const useText = globalOptions.text || false;

      // Set logger verbosity
      setLoggerVerbose(globalOptions.verbose || false);

      // Load configuration
      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);

      logger.info("Fetching folders");
      logger.debug(`Parameters: maxResults=${options.maxResults}, startAt=${options.startAt}`);

      // Create API client
      const client = createClient(profile);

      // Build API parameters
      const apiParams = {
        maxResults: options.maxResults,
        startAt: options.startAt,
        ...(options.projectKey && { projectKey: options.projectKey }),
        ...(options.folderType && { folderType: options.folderType }),
      };

      // Fetch folders
      const response = await client.folders.listFolders(apiParams);

      const folders = response.data.values || [];
      logger.info(`Found ${folders.length} folder(s)`);

      // Define table columns
      const columns: TableColumn<Folder>[] = [
        { header: "ID", getValue: (f) => f.id },
        { header: "NAME", getValue: (f) => f.name },
        { header: "TYPE", getValue: (f) => f.folderType },
        { header: "PROJECT", getValue: (f) => f.project?.id },
      ];

      // Show pagination info and output results
      showPaginationInfo(!!response.data.next, options.startAt, options.maxResults);
      outputResults(folders, useText, (data) => formatAsTable(data as Folder[], columns));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
