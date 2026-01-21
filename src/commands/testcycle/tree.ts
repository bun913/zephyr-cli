/**
 * Testcycle tree command implementation
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
 * Fetch all test executions for a test cycle
 */
async function fetchTestExecutions(
  client: ZephyrClient,
  projectKey: string,
  testCycleKey: string,
): Promise<{ testCaseKey: string }[]> {
  const executions: { testCaseKey: string }[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const response = await client.testexecutions.listTestExecutions({
      projectKey,
      testCycle: testCycleKey,
      maxResults,
      startAt,
    });

    const items = response.data.values || [];
    for (const exec of items) {
      // Extract test case key from self URL
      const selfUrl = exec.testCase?.self;
      if (selfUrl) {
        const match = selfUrl.match(/testcases\/([^/]+)/);
        if (match) {
          executions.push({ testCaseKey: match[1] });
        }
      }
    }

    if (!response.data.next) {
      break;
    }
    startAt += maxResults;
  }

  return executions;
}

/**
 * Fetch test case details
 */
async function fetchTestCase(
  client: ZephyrClient,
  testCaseKey: string,
): Promise<{ key: string; name: string; folderId: number | null }> {
  const response = await client.testcases.getTestCase(testCaseKey);
  const tc = response.data;
  return {
    key: tc.key,
    name: tc.name,
    folderId: tc.folder?.id ?? null,
  };
}

/**
 * Fetch folder details
 */
async function fetchFolder(client: ZephyrClient, folderId: number): Promise<Folder> {
  const response = await client.folders.getFolder(folderId);
  return response.data;
}

/**
 * Build tree from test cases and folders
 */
function buildTree(
  testCases: { key: string; name: string; folderId: number | null }[],
  folders: Map<number, Folder>,
): FolderTreeNode[] {
  // Build adjacency list for folders
  const adjacencyList = new Map<number | null, Folder[]>();
  for (const folder of folders.values()) {
    const parentId = folder.parentId ?? null;
    if (!adjacencyList.has(parentId)) {
      adjacencyList.set(parentId, []);
    }
    adjacencyList.get(parentId)?.push(folder);
  }

  // Group test cases by folder
  const testCasesByFolder = new Map<number | null, { key: string; name: string }[]>();
  for (const tc of testCases) {
    const folderId = tc.folderId;
    if (!testCasesByFolder.has(folderId)) {
      testCasesByFolder.set(folderId, []);
    }
    testCasesByFolder.get(folderId)?.push({ key: tc.key, name: tc.name });
  }

  // DFS to build tree
  function buildNode(folderId: number): FolderTreeNode {
    const folder = folders.get(folderId);
    if (!folder) {
      throw new Error(`Folder ${folderId} not found`);
    }

    const children = adjacencyList.get(folderId) || [];
    const childNodes: FolderTreeNode[] = [];
    for (const child of children) {
      childNodes.push(buildNode(child.id));
    }

    return {
      id: folder.id,
      name: folder.name,
      children: childNodes,
      testCases: testCasesByFolder.get(folderId) || [],
    };
  }

  // Find root folders (folders with no parent in our set, or parent is null)
  const rootFolderIds = new Set<number>();
  for (const folder of folders.values()) {
    if (folder.parentId === null || folder.parentId === undefined) {
      rootFolderIds.add(folder.id);
    } else if (!folders.has(folder.parentId)) {
      rootFolderIds.add(folder.id);
    }
  }

  const result: FolderTreeNode[] = [];
  for (const rootId of rootFolderIds) {
    result.push(buildNode(rootId));
  }

  // Add test cases without folder (at root level)
  const rootTestCases = testCasesByFolder.get(null) || [];
  if (rootTestCases.length > 0) {
    result.push({
      id: 0,
      name: "(No Folder)",
      children: [],
      testCases: rootTestCases,
    });
  }

  return result;
}

/**
 * Register 'testcycle tree' command
 */
export function registerTreeCommand(parent: Command): void {
  parent
    .command("tree <testCycleKey>")
    .description(
      "Get folder tree with test cases for a test cycle (this operation may take a long time)",
    )
    .action(async (testCycleKey: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        const useText = globalOptions.text || false;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);
        const client = createClient(profile);

        logger.info(`Fetching tree for test cycle: ${testCycleKey}`);
        logger.info("This may take a while...");

        // 1. Fetch all test executions
        logger.info("Fetching test executions...");
        const executions = await fetchTestExecutions(client, profile.projectKey, testCycleKey);
        logger.info(`Found ${executions.length} test execution(s)`);

        if (executions.length === 0) {
          console.log(useText ? "(No test cases in this cycle)" : "[]");
          return;
        }

        // 2. Fetch test case details (deduplicate keys)
        const uniqueKeys = [...new Set(executions.map((e) => e.testCaseKey))];
        logger.info(`Fetching ${uniqueKeys.length} test case(s)...`);

        const testCases: { key: string; name: string; folderId: number | null }[] = [];
        const folderIds = new Set<number>();

        for (const key of uniqueKeys) {
          logger.debug(`Fetching test case: ${key}`);
          const tc = await fetchTestCase(client, key);
          testCases.push(tc);
          if (tc.folderId !== null) {
            folderIds.add(tc.folderId);
          }
        }

        // 3. Fetch folder details and their parents
        logger.info("Fetching folder details...");
        const folders = new Map<number, Folder>();
        const foldersToFetch = [...folderIds];

        while (foldersToFetch.length > 0) {
          const folderId = foldersToFetch.pop();
          if (folderId === undefined || folders.has(folderId)) {
            continue;
          }

          logger.debug(`Fetching folder: ${folderId}`);
          const folder = await fetchFolder(client, folderId);
          folders.set(folderId, folder);

          // Add parent to fetch queue
          if (folder.parentId && !folders.has(folder.parentId)) {
            foldersToFetch.push(folder.parentId);
          }
        }

        logger.info(`Found ${folders.size} folder(s)`);

        // 4. Build tree
        logger.info("Building tree...");
        const tree = buildTree(testCases, folders);

        // 5. Output
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
