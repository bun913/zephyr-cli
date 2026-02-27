import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { fetchCycleData, fetchSingleTestCaseData } from "../../snapshot/fetch";
import { readSnapshot, writeSnapshot } from "../../snapshot/file";
import { buildSnapshot, mergeSnapshot, reloadTestCase } from "../../snapshot/merge";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { createSpinner } from "../../utils/spinner";

const TEST_CYCLE_KEY_PATTERN = /^[A-Z]+-R\d+$/;
const TEST_CASE_KEY_PATTERN = /^[A-Z]+-T\d+$/;

export function registerSyncCommand(parent: Command): void {
  parent
    .command("sync <target>")
    .description("Sync test cycle data to a snapshot JSON file")
    .option("-o, --output <path>", "Output file path (required for initial sync)")
    .option("-t, --test-case <key>", "Reload a single test case (e.g. CPD-T123)")
    .action(async (target: string, options: { output?: string; testCase?: string }, command) => {
      const spinner = createSpinner("Starting sync...");
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);
        const client = createClient(profile);

        const isInitialSync = TEST_CYCLE_KEY_PATTERN.test(target);
        const progress = { onProgress: (msg: string) => spinner.update(msg) };

        if (isInitialSync) {
          if (!options.output) {
            spinner.stop();
            logger.error("Initial sync requires -o <path> option");
            process.exit(1);
          }

          const testCycleKey = target;
          const data = await fetchCycleData(client, profile.projectKey, testCycleKey, progress);
          spinner.update("Building snapshot...");
          const snapshot = buildSnapshot(profile.projectKey, testCycleKey, data);
          writeSnapshot(options.output, snapshot);

          spinner.stop(
            `Snapshot saved to ${options.output} (${snapshot.testCases.length} test cases)`,
          );
        } else if (options.testCase) {
          // Single test case reload
          const testCaseKey = options.testCase;
          if (!TEST_CASE_KEY_PATTERN.test(testCaseKey)) {
            spinner.stop();
            logger.error(`Invalid test case key: ${testCaseKey}`);
            process.exit(1);
          }

          const filePath = target;
          const local = readSnapshot(filePath);
          const tc = local.testCases.find((t) => t.key === testCaseKey);
          if (!tc) {
            spinner.stop();
            logger.error(`Test case ${testCaseKey} not found in snapshot`);
            process.exit(1);
          }

          spinner.update(`Reloading ${testCaseKey}...`);
          const data = await fetchSingleTestCaseData(
            client,
            profile.projectKey,
            testCaseKey,
            tc.execution.id,
          );
          const updated = reloadTestCase(local, testCaseKey, data);
          writeSnapshot(filePath, updated);

          spinner.stop(`Reloaded: ${testCaseKey}`);
        } else {
          const filePath = target;
          const local = readSnapshot(filePath);
          const { testCycleKey } = local;

          const data = await fetchCycleData(client, profile.projectKey, testCycleKey, progress);
          spinner.update("Merging changes...");
          const result = mergeSnapshot(local, data);
          writeSnapshot(filePath, result.snapshot);

          spinner.stop(
            `Snapshot updated: ${filePath} (added: ${result.added.length}, removed: ${result.removed.length}, updated: ${result.updated.length})`,
          );
        }
      } catch (error) {
        spinner.stop();
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
