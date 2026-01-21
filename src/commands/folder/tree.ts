/**
 * Folder tree command implementation
 */

import type { Command } from "commander";
import type { Folder, ZephyrClient } from "zephyr-api-client";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { type FolderTreeNode, printTreeAsText } from "../../utils/tree";

/**
 * Fetch all folders with pagination
 */
async function fetchAllFolders(client: ZephyrClient, projectKey: string): Promise<Folder[]> {
  const allFolders: Folder[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const response = await client.folders.listFolders({
      projectKey,
      folderType: "TEST_CASE",
      maxResults,
      startAt,
    });

    const folders = response.data.values || [];
    allFolders.push(...folders);

    if (!response.data.next) {
      break;
    }
    startAt += maxResults;
  }

  return allFolders;
}

/**
 * Build tree using adjacency list
 */
function buildTree(folders: Folder[]): FolderTreeNode[] {
  // Build adjacency list: parentId -> children
  const adjacencyList = new Map<number | null, Folder[]>();
  for (const folder of folders) {
    const parentId = folder.parentId ?? null;
    if (!adjacencyList.has(parentId)) {
      adjacencyList.set(parentId, []);
    }
    adjacencyList.get(parentId)?.push(folder);
  }

  // DFS to build tree
  function dfs(folder: Folder): FolderTreeNode {
    const children = adjacencyList.get(folder.id) || [];
    return {
      id: folder.id,
      name: folder.name,
      children: children.map(dfs),
      testCases: [],
    };
  }

  // Start from root folders (parentId is null)
  const rootFolders = adjacencyList.get(null) || [];
  return rootFolders.map(dfs);
}

/**
 * Register 'folder tree' command
 */
export function registerTreeCommand(parent: Command): void {
  parent
    .command("tree")
    .description("Get folder tree structure recursively")
    .action(async (_options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const useText = globalOptions.text || false;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);
        const client = createClient(profile);

        logger.info("Fetching folder tree...");

        // 1. Fetch all folders
        const folders = await fetchAllFolders(client, profile.projectKey);
        logger.info(`Found ${folders.length} folder(s)`);

        // 2. Build tree
        const tree = buildTree(folders);

        // 3. Output
        if (useText) {
          printTreeAsText(tree);
        } else {
          console.log(JSON.stringify(tree, null, 2));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
