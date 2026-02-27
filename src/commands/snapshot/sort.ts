import type { Command } from "commander";
import type { GlobalOptions } from "../../config/types";
import { readSnapshot, writeSnapshot } from "../../snapshot/file";
import { type SortKey, sortSnapshot } from "../../snapshot/sort";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";

const VALID_SORT_KEYS: SortKey[] = ["key", "created", "name", "folder", "status", "original"];

export function registerSortCommand(parent: Command): void {
  parent
    .command("sort <file>")
    .description("Sort test cases in a snapshot file")
    .requiredOption("--by <key>", `Sort key (${VALID_SORT_KEYS.join(", ")})`)
    .action(async (file: string, options: { by: string }, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const sortKey = options.by as SortKey;
        if (!VALID_SORT_KEYS.includes(sortKey)) {
          logger.error(
            `Invalid sort key: ${options.by}. Valid keys: ${VALID_SORT_KEYS.join(", ")}`,
          );
          process.exit(1);
        }

        const snapshot = readSnapshot(file);
        sortSnapshot(snapshot, sortKey);
        writeSnapshot(file, snapshot);

        console.log(`Snapshot sorted by "${sortKey}": ${file}`);
        console.log(`  Test cases: ${snapshot.testCases.length}`);
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
