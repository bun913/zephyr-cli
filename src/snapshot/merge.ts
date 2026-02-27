import type { FetchedCycleData, FetchedExecutionStep, FetchedTestStep } from "./fetch";
import { calcOriginalIndex } from "./fractional-index";
import type { Snapshot, SnapshotExecution, SnapshotStep, SnapshotTestCase } from "./types";

export interface MergeResult {
  snapshot: Snapshot;
  added: string[];
  removed: string[];
  updated: string[];
}

function buildFolderPath(
  folderId: number | null,
  folders: Map<number, { id: number; name: string; parentId: number | null }>,
): string {
  if (folderId === null) return "";

  const parts: string[] = [];
  let currentId: number | null = folderId;

  while (currentId !== null) {
    const folder = folders.get(currentId);
    if (!folder) break;
    parts.unshift(folder.name);
    currentId = folder.parentId;
  }

  return `/${parts.join("/")}`;
}

function buildSteps(
  testCaseSteps: FetchedTestStep[],
  executionSteps: FetchedExecutionStep[],
  statusMap: Map<number, string>,
): SnapshotStep[] {
  return testCaseSteps.map((step, i) => {
    const execStep = executionSteps[i];
    return {
      index: i,
      description: step.description,
      testData: step.testData,
      expectedResult: step.expectedResult,
      result: {
        status: execStep?.statusId != null ? (statusMap.get(execStep.statusId) ?? null) : null,
        actualResult: execStep?.actualResult ?? "",
      },
    };
  });
}

function buildTestCase(
  executionId: number,
  testCaseKey: string,
  originalIndex: number,
  data: FetchedCycleData,
): SnapshotTestCase {
  const tc = data.testCases.get(testCaseKey);
  const execution = data.executions.find((e) => e.id === executionId);
  const tcSteps = data.testCaseSteps.get(testCaseKey) ?? [];
  const exSteps = data.executionSteps.get(executionId) ?? [];

  const statusName =
    execution?.statusId != null ? (data.statusMap.get(execution.statusId) ?? null) : null;

  const snapshotExecution: SnapshotExecution = {
    id: executionId,
    status: statusName,
    comment: execution?.comment ?? null,
    executedBy: execution?.executedById ?? null,
    actualEndDate: execution?.actualEndDate ?? null,
    executionTime: execution?.executionTime ?? null,
  };

  return {
    key: testCaseKey,
    name: tc?.name ?? "",
    objective: tc?.objective ?? "",
    precondition: tc?.precondition ?? "",
    estimatedTime: tc?.estimatedTime ?? null,
    labels: tc?.labels ?? [],
    component: tc?.component ?? null,
    customFields: tc?.customFields ?? {},
    folderId: tc?.folderId ?? null,
    folderPath: buildFolderPath(tc?.folderId ?? null, data.folders),
    createdAt: tc?.createdOn ?? "",
    originalIndex,
    execution: snapshotExecution,
    steps: buildSteps(tcSteps, exSteps, data.statusMap),
    excluded: false,
  };
}

export function buildSnapshot(
  projectKey: string,
  testCycleKey: string,
  data: FetchedCycleData,
): Snapshot {
  const testCases: SnapshotTestCase[] = data.executions.map((exec, index) =>
    buildTestCase(exec.id, exec.testCaseKey, index, data),
  );

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    projectKey,
    testCycleKey,
    testCycleName: data.testCycleName,
    testCases,
  };
}

export function mergeSnapshot(local: Snapshot, data: FetchedCycleData): MergeResult {
  const remoteExecMap = new Map<string, { executionId: number }>();
  for (const exec of data.executions) {
    remoteExecMap.set(exec.testCaseKey, { executionId: exec.id });
  }

  const zephyrOrder = data.executions.map((e) => e.testCaseKey);

  const added: string[] = [];
  const removed: string[] = [];
  const updated: string[] = [];
  const newTestCases: SnapshotTestCase[] = [];
  const processedKeys = new Set<string>();

  // Walk existing local test cases
  for (const localCase of local.testCases) {
    const remote = remoteExecMap.get(localCase.key);
    if (remote) {
      // Update from remote, keeping originalIndex and excluded
      const updatedCase = buildTestCase(
        remote.executionId,
        localCase.key,
        localCase.originalIndex,
        data,
      );
      updatedCase.excluded = localCase.excluded;
      newTestCases.push(updatedCase);
      updated.push(localCase.key);
      processedKeys.add(localCase.key);
    } else {
      // Removed from remote
      removed.push(localCase.key);
    }
  }

  // Remaining in remote → new items
  for (const exec of data.executions) {
    if (!processedKeys.has(exec.testCaseKey)) {
      const originalIndex = calcOriginalIndex(zephyrOrder, exec.testCaseKey, newTestCases);
      const newCase = buildTestCase(exec.id, exec.testCaseKey, originalIndex, data);
      newTestCases.push(newCase);
      added.push(exec.testCaseKey);
    }
  }

  const snapshot: Snapshot = {
    ...local,
    exportedAt: new Date().toISOString(),
    testCycleName: data.testCycleName,
    testCases: newTestCases,
  };

  return { snapshot, added, removed, updated };
}
