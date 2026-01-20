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
import { type FolderTreeOptions, registerTreeOptions } from "./options";

/**
 * Tree node structure for output
 */
interface FolderTreeNode {
  id: number;
  name: string;
  children: FolderTreeNode[];
  testCases: { key: string; name: string }[];
}

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
 * Fetch test cases for a folder
 */
async function fetchTestCases(
  client: ZephyrClient,
  projectKey: string,
  folderId: number,
  maxTestCases: number,
  fetchAll: boolean,
): Promise<{ key: string; name: string }[]> {
  const testCases: { key: string; name: string }[] = [];
  let startAt = 0;

  while (true) {
    const limit = fetchAll ? 100 : Math.min(100, maxTestCases - testCases.length);
    const response = await client.testcases.listTestCases({
      projectKey,
      folderId,
      maxResults: limit,
      startAt,
    });

    const cases = response.data.values || [];
    for (const tc of cases) {
      testCases.push({ key: tc.key, name: tc.name });
      if (!fetchAll && testCases.length >= maxTestCases) {
        return testCases;
      }
    }

    if (!response.data.next) {
      break;
    }
    startAt += 100;
  }

  return testCases;
}

/**
 * Build tree using adjacency list and DFS
 */
async function buildTree(
  client: ZephyrClient,
  projectKey: string,
  folders: Folder[],
  maxTestCases: number,
  fetchAll: boolean,
): Promise<FolderTreeNode[]> {
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
  async function dfs(folder: Folder): Promise<FolderTreeNode> {
    logger.debug(`Processing: ${folder.name} (ID: ${folder.id})`);

    const testCases = await fetchTestCases(client, projectKey, folder.id, maxTestCases, fetchAll);
    logger.debug(`  Found ${testCases.length} test case(s)`);

    const children = adjacencyList.get(folder.id) || [];
    const childNodes: FolderTreeNode[] = [];
    for (const child of children) {
      childNodes.push(await dfs(child));
    }

    return {
      id: folder.id,
      name: folder.name,
      children: childNodes,
      testCases,
    };
  }

  // Start from root folders (parentId is null)
  const rootFolders = adjacencyList.get(null) || [];
  const result: FolderTreeNode[] = [];
  for (const root of rootFolders) {
    result.push(await dfs(root));
  }

  return result;
}

/**
 * Register 'folder tree' command
 */
export function registerTreeCommand(parent: Command): void {
  const treeCommand = parent
    .command("tree")
    .description(
      "Get folder tree with test cases recursively (this operation may take a long time)",
    );

  registerTreeOptions(treeCommand).action(async (options: FolderTreeOptions, command) => {
    try {
      const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
      setLoggerVerbose(globalOptions.verbose || false);

      const config = loadConfig(globalOptions.config);
      const profile = getProfile(config, globalOptions.profile);
      const client = createClient(profile);

      logger.info("Fetching folder tree (this may take a while)...");

      // 1. Fetch all folders
      logger.info("Fetching all folders...");
      const folders = await fetchAllFolders(client, profile.projectKey);
      logger.info(`Found ${folders.length} folder(s)`);

      // 2. Build tree with test cases
      logger.info("Building tree and fetching test cases...");
      const tree = await buildTree(
        client,
        profile.projectKey,
        folders,
        options.maxTestCases,
        options.all || false,
      );

      // 3. Output JSON
      console.log(JSON.stringify(tree, null, 2));
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
