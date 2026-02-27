import { useCallback, useRef } from "react";
import type { ZephyrV2Client } from "zephyr-api-client";
import { fetchCycleData } from "../../../snapshot/fetch";
import { readSnapshot, writeSnapshot } from "../../../snapshot/file";
import { type MergeResult, mergeSnapshot } from "../../../snapshot/merge";
import { pushExecutionStatus, pushStepResults } from "../../../snapshot/push";
import type { Snapshot, SnapshotStep } from "../../../snapshot/types";

/** Derive execution status from steps: Blocked > Fail > all Pass. Returns null if undetermined. */
function deriveExecutionStatus(steps: SnapshotStep[]): string | null {
  if (steps.length === 0) return null;
  let hasBlocked = false;
  let hasFail = false;
  let allPass = true;
  for (const step of steps) {
    const s = step.result.status;
    if (s === "Blocked") hasBlocked = true;
    if (s === "Fail") hasFail = true;
    if (s !== "Pass") allPass = false;
  }
  if (hasBlocked) return "Blocked";
  if (hasFail) return "Fail";
  if (allPass) return "Pass";
  return null;
}

interface UseApiActionsOptions {
  client: ZephyrV2Client;
  projectKey: string;
  filePath: string;
  getSnapshot: () => Snapshot;
  updateSnapshot: (snapshot: Snapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
}

export function useApiActions(options: UseApiActionsOptions) {
  const { client, projectKey, filePath, getSnapshot, updateSnapshot, setLoading, setError } =
    options;
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback(
    (message: string) => {
      setError(message);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 5000);
    },
    [setError],
  );

  const pushStep = useCallback(
    async (
      testCaseIndex: number,
      stepIndex: number,
      status: string,
      actualResult?: string,
    ): Promise<boolean> => {
      setLoading(true);
      const snapshot = getSnapshot();
      const testCase = snapshot.testCases[testCaseIndex];

      // Save previous state for revert
      const prevStatus = testCase.steps[stepIndex].result.status;
      const prevActualResult = testCase.steps[stepIndex].result.actualResult;

      // Update locally first
      testCase.steps[stepIndex].result.status = status;
      if (actualResult !== undefined) {
        testCase.steps[stepIndex].result.actualResult = actualResult;
      }

      try {
        // Ensure execution exists
        let executionId = testCase.execution.id;
        if (executionId === null) {
          executionId = await pushExecutionStatus(
            client,
            projectKey,
            snapshot.testCycleKey,
            testCase,
            "Not Executed",
          );
          testCase.execution.id = executionId;
        }

        // Push ALL steps (API replaces all)
        const stepPayload = testCase.steps.map((s) => ({
          statusName: s.result.status ?? "Not Executed",
          actualResult: s.result.actualResult || undefined,
        }));
        await pushStepResults(client, executionId, stepPayload);

        // Auto-derive execution status from steps
        const derived = deriveExecutionStatus(testCase.steps);
        if (derived && derived !== testCase.execution.status) {
          const newExecId = await pushExecutionStatus(
            client,
            projectKey,
            snapshot.testCycleKey,
            testCase,
            derived,
          );
          testCase.execution.id = newExecId;
          testCase.execution.status = derived;
        }

        writeSnapshot(filePath, snapshot);
        updateSnapshot({ ...snapshot });
        setLoading(false);
        return true;
      } catch (error) {
        // Revert local change
        testCase.steps[stepIndex].result.status = prevStatus;
        testCase.steps[stepIndex].result.actualResult = prevActualResult;
        updateSnapshot({ ...snapshot });
        setLoading(false);
        showError(`API error: ${error instanceof Error ? error.message : "Unknown error"}`);
        return false;
      }
    },
    [client, projectKey, filePath, getSnapshot, updateSnapshot, setLoading, showError],
  );

  const pushExecution = useCallback(
    async (testCaseIndex: number, status: string, comment?: string): Promise<boolean> => {
      setLoading(true);
      const snapshot = getSnapshot();
      const testCase = snapshot.testCases[testCaseIndex];

      try {
        const executionId = await pushExecutionStatus(
          client,
          projectKey,
          snapshot.testCycleKey,
          testCase,
          status,
          comment,
        );

        testCase.execution.id = executionId;
        testCase.execution.status = status;
        if (comment) {
          testCase.execution.comment = comment;
        }

        writeSnapshot(filePath, snapshot);
        updateSnapshot({ ...snapshot });
        setLoading(false);
        return true;
      } catch (error) {
        setLoading(false);
        showError(`API error: ${error instanceof Error ? error.message : "Unknown error"}`);
        return false;
      }
    },
    [client, projectKey, filePath, getSnapshot, updateSnapshot, setLoading, showError],
  );

  const pushAllSteps = useCallback(
    async (testCaseIndex: number, status: string): Promise<boolean> => {
      setLoading(true);
      const snapshot = getSnapshot();
      const testCase = snapshot.testCases[testCaseIndex];
      if (testCase.steps.length === 0) {
        setLoading(false);
        return false;
      }

      // Save previous state for revert
      const prevSteps = testCase.steps.map((s) => ({
        status: s.result.status,
        actualResult: s.result.actualResult,
      }));

      // Update all steps locally
      for (const step of testCase.steps) {
        step.result.status = status;
      }

      try {
        // Ensure execution exists
        let executionId = testCase.execution.id;
        if (executionId === null) {
          executionId = await pushExecutionStatus(
            client,
            projectKey,
            snapshot.testCycleKey,
            testCase,
            "Not Executed",
          );
          testCase.execution.id = executionId;
        }

        // Push ALL steps (API replaces all)
        const stepPayload = testCase.steps.map((s) => ({
          statusName: s.result.status ?? "Not Executed",
          actualResult: s.result.actualResult || undefined,
        }));
        await pushStepResults(client, executionId, stepPayload);

        // Auto-derive execution status from steps
        const derived = deriveExecutionStatus(testCase.steps);
        if (derived && derived !== testCase.execution.status) {
          const newExecId = await pushExecutionStatus(
            client,
            projectKey,
            snapshot.testCycleKey,
            testCase,
            derived,
          );
          testCase.execution.id = newExecId;
          testCase.execution.status = derived;
        }

        writeSnapshot(filePath, snapshot);
        updateSnapshot({ ...snapshot });
        setLoading(false);
        return true;
      } catch (error) {
        // Revert local changes
        for (let i = 0; i < testCase.steps.length; i++) {
          testCase.steps[i].result.status = prevSteps[i].status;
          testCase.steps[i].result.actualResult = prevSteps[i].actualResult;
        }
        updateSnapshot({ ...snapshot });
        setLoading(false);
        showError(`API error: ${error instanceof Error ? error.message : "Unknown error"}`);
        return false;
      }
    },
    [client, projectKey, filePath, getSnapshot, updateSnapshot, setLoading, showError],
  );

  const syncSnapshot = useCallback(
    async (onProgress: (message: string) => void): Promise<MergeResult> => {
      const snapshot = readSnapshot(filePath);
      const data = await fetchCycleData(client, projectKey, snapshot.testCycleKey, { onProgress });
      const result = mergeSnapshot(snapshot, data);
      writeSnapshot(filePath, result.snapshot);
      updateSnapshot(result.snapshot);
      return result;
    },
    [client, projectKey, filePath, updateSnapshot],
  );

  return { pushStep, pushAllSteps, pushExecution, syncSnapshot };
}
