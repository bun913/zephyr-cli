export interface Snapshot {
  version: string;
  exportedAt: string;
  projectKey: string;
  testCycleKey: string;
  testCycleName: string;
  testCases: SnapshotTestCase[];
}

export interface SnapshotTestCase {
  key: string;
  name: string;
  objective: string;
  precondition: string;
  estimatedTime: number | null;
  labels: string[];
  component: string | null;
  customFields: Record<string, unknown>;
  folderId: number | null;
  folderPath: string;
  createdAt: string;
  originalIndex: number;
  execution: SnapshotExecution;
  steps: SnapshotStep[];
  excluded: boolean;
}

export interface SnapshotExecution {
  id: number | null;
  status: string | null;
  comment: string | null;
  executedBy: string | null;
  actualEndDate: string | null;
  executionTime: number | null;
}

export interface SnapshotStep {
  index: number;
  description: string;
  testData: string;
  expectedResult: string;
  result: SnapshotStepResult;
}

export interface SnapshotStepResult {
  status: string | null;
  actualResult: string;
}
