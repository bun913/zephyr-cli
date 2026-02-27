import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { readSnapshot, writeSnapshot } from "../../snapshot/file";
import { pushExecutionStatus, pushStepResults } from "../../snapshot/push";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";

export function registerRecordCommand(parent: Command): void {
  parent
    .command("record <file> <testCaseKey>")
    .description("Record test result to Zephyr and update local snapshot")
    .requiredOption("--status <name>", "Execution status (Pass, Fail, Blocked, Not Executed)")
    .option("--comment <text>", "Execution comment")
    .option("--step <index>", "Step index to update (0-based)", (val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 0) {
        throw new Error("--step must be a non-negative number");
      }
      return num;
    })
    .option("--actual-result <text>", "Actual result for the step")
    .action(
      async (
        file: string,
        testCaseKey: string,
        options: {
          status: string;
          comment?: string;
          step?: number;
          actualResult?: string;
        },
        command,
      ) => {
        try {
          const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
          setLoggerVerbose(globalOptions.verbose || false);

          const config = loadConfig(globalOptions.config);
          const profile = getProfile(config, globalOptions.profile);
          const client = createClient(profile);

          const snapshot = readSnapshot(file);
          const testCase = snapshot.testCases.find((tc) => tc.key === testCaseKey);

          if (!testCase) {
            logger.error(`Test case ${testCaseKey} not found in snapshot`);
            process.exit(1);
          }

          if (testCase.excluded) {
            logger.error(`Test case ${testCaseKey} is excluded`);
            process.exit(1);
          }

          if (options.step !== undefined) {
            // Step-level update
            const stepIndex = options.step;
            if (stepIndex >= testCase.steps.length) {
              logger.error(`Step index ${stepIndex} out of range (0-${testCase.steps.length - 1})`);
              process.exit(1);
            }

            // Ensure execution exists first
            let executionId = testCase.execution.id;
            if (executionId === null) {
              executionId = await pushExecutionStatus(
                client,
                profile.projectKey,
                snapshot.testCycleKey,
                testCase,
                "Not Executed",
              );
              testCase.execution.id = executionId;
            }

            // Build all step results, updating only the target step
            const stepPayload = testCase.steps.map((s, i) => ({
              statusName: i === stepIndex ? options.status : (s.result.status ?? "Not Executed"),
              actualResult:
                i === stepIndex
                  ? (options.actualResult ?? s.result.actualResult)
                  : s.result.actualResult,
            }));

            await pushStepResults(client, executionId, stepPayload);

            // Update local snapshot
            testCase.steps[stepIndex].result.status = options.status;
            if (options.actualResult !== undefined) {
              testCase.steps[stepIndex].result.actualResult = options.actualResult;
            }

            writeSnapshot(file, snapshot);
            console.log(`Step ${stepIndex} of ${testCaseKey}: ${options.status}`);
          } else {
            // Execution-level update
            const executionId = await pushExecutionStatus(
              client,
              profile.projectKey,
              snapshot.testCycleKey,
              testCase,
              options.status,
              options.comment,
            );

            // Update local snapshot
            testCase.execution.id = executionId;
            testCase.execution.status = options.status;
            if (options.comment !== undefined) {
              testCase.execution.comment = options.comment;
            }

            writeSnapshot(file, snapshot);
            console.log(`${testCaseKey}: ${options.status}`);
          }
        } catch (error) {
          logger.error(formatError(error as Error));
          process.exit(1);
        }
      },
    );
}
