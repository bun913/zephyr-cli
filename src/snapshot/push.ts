import type { ZephyrV2Client } from "zephyr-api-client";
import type { SnapshotTestCase } from "./types";

export async function pushExecutionStatus(
  client: ZephyrV2Client,
  projectKey: string,
  testCycleKey: string,
  testCase: SnapshotTestCase,
  statusName: string,
  comment?: string,
): Promise<number> {
  if (testCase.execution.id !== null) {
    // Update existing execution
    await client.testexecutions.updateTestExecution(String(testCase.execution.id), {
      statusName,
      ...(comment !== undefined && { comment }),
    });
    return testCase.execution.id;
  }

  // Create new execution
  const response = await client.testexecutions.createTestExecution({
    projectKey,
    testCaseKey: testCase.key,
    testCycleKey,
    statusName,
    ...(comment !== undefined && { comment }),
  });
  return response.data.id ?? testCase.execution.id ?? 0;
}

export async function pushStepResults(
  client: ZephyrV2Client,
  executionId: number,
  steps: { statusName: string; actualResult?: string }[],
): Promise<void> {
  await client.testexecutions.putTestExecutionTestSteps(String(executionId), {
    steps: steps.map((s) => ({
      statusName: s.statusName,
      ...(s.actualResult !== undefined && { actualResult: s.actualResult }),
    })),
  });
}
