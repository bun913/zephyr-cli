import { useCallback, useRef } from "react";
import type { ZephyrV2Client } from "zephyr-api-client";
import { writeSnapshot } from "../../../snapshot/file";
import { pushExecutionStatus, pushStepResults } from "../../../snapshot/push";
import type { Snapshot } from "../../../snapshot/types";

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

  return { pushStep, pushExecution };
}
