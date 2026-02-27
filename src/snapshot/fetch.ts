import type { ZephyrV2Client } from "zephyr-api-client";
import { logger } from "../utils/logger";

export interface FetchedExecution {
  id: number;
  testCaseKey: string;
  statusId: number | null;
  comment: string | null;
  executedById: string | null;
  actualEndDate: string | null;
  executionTime: number | null;
}

export interface FetchedTestCase {
  key: string;
  name: string;
  objective: string;
  precondition: string;
  estimatedTime: number | null;
  labels: string[];
  component: string | null;
  customFields: Record<string, unknown>;
  folderId: number | null;
  createdOn: string;
}

export interface FetchedTestStep {
  description: string;
  testData: string;
  expectedResult: string;
}

export interface FetchedExecutionStep {
  actualResult: string;
  statusId: number | null;
}

export interface FetchedCycleData {
  testCycleName: string;
  executions: FetchedExecution[];
  testCases: Map<string, FetchedTestCase>;
  testCaseSteps: Map<string, FetchedTestStep[]>;
  executionSteps: Map<number, FetchedExecutionStep[]>;
  folders: Map<number, { id: number; name: string; parentId: number | null }>;
  statusMap: Map<number, string>;
}

async function parallelMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      if (item === undefined) continue;
      results[i] = await fn(item);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchAllTestExecutions(
  client: ZephyrV2Client,
  projectKey: string,
  testCycleKey: string,
): Promise<FetchedExecution[]> {
  const executions: FetchedExecution[] = [];
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
      const selfUrl = exec.testCase?.self;
      if (!selfUrl) continue;

      const match = selfUrl.match(/testcases\/([^/]+)/);
      if (!match) continue;

      executions.push({
        id: exec.id,
        testCaseKey: match[1] ?? "",
        statusId: exec.testExecutionStatus?.id ?? null,
        comment: exec.comment ?? null,
        executedById: exec.executedById ?? null,
        actualEndDate: exec.actualEndDate ?? null,
        executionTime: exec.executionTime ?? null,
      });
    }

    if (!response.data.next) break;
    startAt += maxResults;
  }

  return executions;
}

async function fetchAllStatuses(
  client: ZephyrV2Client,
  projectKey: string,
): Promise<Map<number, string>> {
  const statusMap = new Map<number, string>();
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const response = await client.statuses.listStatuses({
      projectKey,
      statusType: "TEST_EXECUTION",
      maxResults,
      startAt,
    });

    const items = response.data.values || [];
    for (const status of items) {
      statusMap.set(status.id, status.name);
    }

    if (!response.data.next) break;
    startAt += maxResults;
  }

  return statusMap;
}

async function fetchTestCaseSteps(
  client: ZephyrV2Client,
  testCaseKey: string,
): Promise<FetchedTestStep[]> {
  const steps: FetchedTestStep[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const response = await client.testcases.getTestCaseTestSteps(testCaseKey, {
      maxResults,
      startAt,
    });

    const items = response.data.values || [];
    for (const step of items) {
      if (step.inline) {
        steps.push({
          description: step.inline.description ?? "",
          testData: step.inline.testData ?? "",
          expectedResult: step.inline.expectedResult ?? "",
        });
      }
    }

    if (!response.data.next) break;
    startAt += maxResults;
  }

  return steps;
}

async function fetchExecutionSteps(
  client: ZephyrV2Client,
  executionId: number,
): Promise<FetchedExecutionStep[]> {
  const steps: FetchedExecutionStep[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const response = await client.testexecutions.getTestExecutionTestSteps(String(executionId), {
      maxResults,
      startAt,
    });

    const items = response.data.values || [];
    for (const step of items) {
      if (step.inline) {
        steps.push({
          actualResult: step.inline.actualResult ?? "",
          statusId: step.inline.status?.id ?? null,
        });
      }
    }

    if (!response.data.next) break;
    startAt += maxResults;
  }

  return steps;
}

export interface FetchProgress {
  onProgress: (message: string) => void;
}

export async function fetchCycleData(
  client: ZephyrV2Client,
  projectKey: string,
  testCycleKey: string,
  progress?: FetchProgress,
): Promise<FetchedCycleData> {
  const report = (msg: string) => {
    logger.info(msg);
    progress?.onProgress(msg);
  };

  // 1. Fetch test cycle name
  report(`Fetching test cycle: ${testCycleKey}`);
  const cycleResponse = await client.testcycles.getTestCycle(testCycleKey);
  const testCycleName = cycleResponse.data.name;
  report(`Test cycle: ${testCycleName}`);

  // 2. Fetch status map
  report("Fetching execution statuses...");
  const statusMap = await fetchAllStatuses(client, projectKey);

  // 3. Fetch all test executions
  report("Fetching test executions...");
  const executions = await fetchAllTestExecutions(client, projectKey, testCycleKey);
  report(`Found ${executions.length} test execution(s)`);

  if (executions.length === 0) {
    return {
      testCycleName,
      executions,
      testCases: new Map(),
      testCaseSteps: new Map(),
      executionSteps: new Map(),
      folders: new Map(),
      statusMap,
    };
  }

  // 4. Fetch test cases, test case steps, and execution steps in parallel
  const uniqueKeys = [...new Set(executions.map((e) => e.testCaseKey))];
  const total = uniqueKeys.length;

  const testCases = new Map<string, FetchedTestCase>();
  const testCaseSteps = new Map<string, FetchedTestStep[]>();
  const executionSteps = new Map<number, FetchedExecutionStep[]>();

  // Fetch test case details in parallel
  let tcDone = 0;
  await parallelMap(
    uniqueKeys,
    async (key) => {
      logger.debug(`Fetching test case: ${key}`);
      const response = await client.testcases.getTestCase(key);
      const tc = response.data;
      testCases.set(key, {
        key: tc.key,
        name: tc.name,
        objective: tc.objective ?? "",
        precondition: tc.precondition ?? "",
        estimatedTime: tc.estimatedTime ?? null,
        labels: (tc.labels as string[]) ?? [],
        component: (tc.component as { name?: string } | null)?.name ?? null,
        customFields: (tc.customFields as Record<string, unknown>) ?? {},
        folderId: tc.folder?.id ?? null,
        createdOn: tc.createdOn ?? "",
      });
      tcDone++;
      report(`Fetching test cases... (${tcDone}/${total})`);
    },
    5,
  );

  // Fetch test case steps in parallel
  let stepsDone = 0;
  await parallelMap(
    uniqueKeys,
    async (key) => {
      logger.debug(`Fetching test case steps: ${key}`);
      const steps = await fetchTestCaseSteps(client, key);
      testCaseSteps.set(key, steps);
      stepsDone++;
      report(`Fetching test case steps... (${stepsDone}/${total})`);
    },
    5,
  );

  // Fetch execution steps in parallel
  let execStepsDone = 0;
  const execTotal = executions.length;
  await parallelMap(
    executions,
    async (exec) => {
      logger.debug(`Fetching execution steps: ${exec.id}`);
      const steps = await fetchExecutionSteps(client, exec.id);
      executionSteps.set(exec.id, steps);
      execStepsDone++;
      report(`Fetching execution steps... (${execStepsDone}/${execTotal})`);
    },
    5,
  );

  // 5. Fetch folders and their parents
  const folderIds = new Set<number>();
  for (const tc of testCases.values()) {
    if (tc.folderId !== null) {
      folderIds.add(tc.folderId);
    }
  }

  report("Fetching folder details...");
  const folders = new Map<number, { id: number; name: string; parentId: number | null }>();
  const foldersToFetch = [...folderIds];

  while (foldersToFetch.length > 0) {
    const folderId = foldersToFetch.pop();
    if (folderId === undefined || folders.has(folderId)) continue;

    logger.debug(`Fetching folder: ${folderId}`);
    const response = await client.folders.getFolder(folderId);
    const folder = response.data;
    folders.set(folderId, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId ?? null,
    });

    if (folder.parentId && !folders.has(folder.parentId)) {
      foldersToFetch.push(folder.parentId);
    }
  }

  report(`Fetched ${folders.size} folder(s)`);

  return {
    testCycleName,
    executions,
    testCases,
    testCaseSteps,
    executionSteps,
    folders,
    statusMap,
  };
}

export interface FetchedSingleTestCaseData {
  testCase: FetchedTestCase;
  testCaseSteps: FetchedTestStep[];
  executionSteps: FetchedExecutionStep[];
  folders: Map<number, { id: number; name: string; parentId: number | null }>;
  statusMap: Map<number, string>;
}

/**
 * Fetch data for a single test case (for partial reload).
 */
export async function fetchSingleTestCaseData(
  client: ZephyrV2Client,
  projectKey: string,
  testCaseKey: string,
  executionId: number | null,
): Promise<FetchedSingleTestCaseData> {
  const statusMap = await fetchAllStatuses(client, projectKey);

  const tcResponse = await client.testcases.getTestCase(testCaseKey);
  const tc = tcResponse.data;
  const testCase: FetchedTestCase = {
    key: tc.key,
    name: tc.name,
    objective: tc.objective ?? "",
    precondition: tc.precondition ?? "",
    estimatedTime: tc.estimatedTime ?? null,
    labels: (tc.labels as string[]) ?? [],
    component: (tc.component as { name?: string } | null)?.name ?? null,
    customFields: (tc.customFields as Record<string, unknown>) ?? {},
    folderId: tc.folder?.id ?? null,
    createdOn: tc.createdOn ?? "",
  };

  const testCaseSteps = await fetchTestCaseSteps(client, testCaseKey);

  let executionSteps: FetchedExecutionStep[] = [];
  if (executionId !== null) {
    executionSteps = await fetchExecutionSteps(client, executionId);
  }

  // Fetch folder chain
  const folders = new Map<number, { id: number; name: string; parentId: number | null }>();
  const foldersToFetch = testCase.folderId !== null ? [testCase.folderId] : [];
  while (foldersToFetch.length > 0) {
    const folderId = foldersToFetch.pop();
    if (folderId === undefined || folders.has(folderId)) continue;
    const folderResponse = await client.folders.getFolder(folderId);
    const folder = folderResponse.data;
    folders.set(folderId, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId ?? null,
    });
    if (folder.parentId && !folders.has(folder.parentId)) {
      foldersToFetch.push(folder.parentId);
    }
  }

  return { testCase, testCaseSteps, executionSteps, folders, statusMap };
}
