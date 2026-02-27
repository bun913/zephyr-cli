import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { fetchCycleData } from "../../snapshot/fetch";
import { readSnapshot, writeSnapshot } from "../../snapshot/file";
import { buildSnapshot, mergeSnapshot } from "../../snapshot/merge";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";
import { createSpinner } from "../../utils/spinner";

const TEST_CYCLE_KEY_PATTERN = /^[A-Z]+-R\d+$/;

export function registerSyncCommand(parent: Command): void {
  parent
    .command("sync <target>")
    .description("Sync test cycle data to a snapshot JSON file")
    .option("-o, --output <path>", "Output file path (required for initial sync)")
    .action(async (target: string, options: { output?: string }, command) => {
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
