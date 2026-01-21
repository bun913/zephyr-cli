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
  hasMoreTestCases: boolean;
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
): Promise<{ testCases: { key: string; name: string }[]; hasMore: boolean }> {
  const testCases: { key: string; name: string }[] = [];
  let startAt = 0;
  let hasMore = false;

  while (true) {
    const limit = fetchAll ? 100 : Math.min(100, maxTestCases - testCases.length + 1);
    const response = await client.testcases.listTestCases({
      projectKey,
      folderId,
      maxResults: limit,
      startAt,
    });

    const cases = response.data.values || [];
    for (const tc of cases) {
      if (!fetchAll && testCases.length >= maxTestCases) {
        hasMore = true;
        return { testCases, hasMore };
      }
      testCases.push({ key: tc.key, name: tc.name });
    }

    if (!response.data.next) {
      break;
    }
    startAt += 100;
  }

  return { testCases, hasMore };
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

    const { testCases, hasMore } = await fetchTestCases(
      client,
      projectKey,
      folder.id,
      maxTestCases,
      fetchAll,
    );
    logger.debug(`  Found ${testCases.length} test case(s)${hasMore ? " (more available)" : ""}`);

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
      hasMoreTestCases: hasMore,
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
 * Format tree as text output
 */
function formatTreeAsText(nodes: FolderTreeNode[], prefix = ""): string {
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    lines.push(`${prefix}${connector}${node.name}/ (${node.id})`);

    // Add test cases
    const hasMore = node.hasMoreTestCases;
    const totalItems = node.children.length + node.testCases.length + (hasMore ? 1 : 0);
    let itemIndex = 0;

    for (const tc of node.testCases) {
      itemIndex++;
      const tcConnector = itemIndex === totalItems ? "└── " : "├── ";
      lines.push(`${prefix}${childPrefix}${tcConnector}${tc.key}: ${tc.name}`);
    }

    // Show "..." if there are more test cases
    if (hasMore) {
      itemIndex++;
      const moreConnector = itemIndex === totalItems ? "└── " : "├── ";
      lines.push(`${prefix}${childPrefix}${moreConnector}...`);
    }

    // Add children recursively
    if (node.children.length > 0) {
      lines.push(formatTreeAsText(node.children, prefix + childPrefix));
    }
  }

  return lines.join("\n");
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
      const useText = globalOptions.text || false;
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

      // 3. Output
      if (useText) {
        for (const root of tree) {
          console.log(`${root.name}/ (${root.id})`);
          // Print test cases at root level
          const hasMore = root.hasMoreTestCases;
          const totalItems = root.children.length + root.testCases.length + (hasMore ? 1 : 0);
          let itemIndex = 0;
          for (const tc of root.testCases) {
            itemIndex++;
            const connector = itemIndex === totalItems ? "└── " : "├── ";
            console.log(`${connector}${tc.key}: ${tc.name}`);
          }
          if (hasMore) {
            itemIndex++;
            const connector = itemIndex === totalItems ? "└── " : "├── ";
            console.log(`${connector}...`);
          }
          // Print children
          if (root.children.length > 0) {
            console.log(formatTreeAsText(root.children));
          }
        }
      } else {
        console.log(JSON.stringify(tree, null, 2));
      }
    } catch (error) {
      logger.error(formatError(error as Error));
      process.exit(1);
    }
  });
}
