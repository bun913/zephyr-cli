import * as readline from "node:readline";
import type { Command } from "commander";
import type { ZephyrV2Client } from "zephyr-api-client";
import { getProfile, loadConfig } from "../config/manager";
import type { GlobalOptions } from "../config/types";
import { parseFilter } from "../play/filter";
import { renderPlayTUI } from "../play/tui/App";
import { fetchCycleData } from "../snapshot/fetch";
import { writeSnapshot } from "../snapshot/file";
import { buildSnapshot } from "../snapshot/merge";
import { createClient } from "../utils/client";
import { formatError } from "../utils/error";
import { logger, setLoggerVerbose } from "../utils/logger";
import { createSpinner } from "../utils/spinner";

async function fetchAllTestCycles(
  client: ZephyrV2Client,
  projectKey: string,
): Promise<{ key: string; name: string }[]> {
  const cycles: { key: string; name: string }[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const response = await client.testcycles.listTestCycles({
      projectKey,
      maxResults,
      startAt,
    });

    const items = response.data.values || [];
    for (const cycle of items) {
      cycles.push({ key: cycle.key, name: cycle.name });
    }

    if (!response.data.next) break;
    startAt += maxResults;
  }

  return cycles;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function registerPlayCommand(program: Command): void {
  program
    .command("play <file>")
    .description("Interactively record test results step by step")
    .option("--filter <spec>", "Filter: unexecuted, folder=<pattern>, status=<name>")
    .action(async (file: string, options: { filter?: string }, command) => {
      try {
        const globalOptions = command.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);
        const client = createClient(profile);

        if (file === "init") {
          // Interactive cycle selection and snapshot creation
          const spinner = createSpinner("Fetching test cycles...");
          const cycles = await fetchAllTestCycles(client, profile.projectKey);
          spinner.stop();

          if (cycles.length === 0) {
            logger.error("No test cycles found");
            process.exit(1);
          }

          for (let i = 0; i < cycles.length; i++) {
            const c = cycles[i];
            if (!c) continue;
            process.stderr.write(`${i + 1}) ${c.key}: ${c.name}\n`);
          }

          const answer = await prompt("\nSelect cycle number: ");
          const index = Number(answer) - 1;
          const selected = cycles[index];
          if (!selected || Number.isNaN(index) || index < 0 || index >= cycles.length) {
            logger.error("Invalid selection");
            process.exit(1);
          }

          const syncSpinner = createSpinner(`Syncing ${selected.key}...`);
          const progress = { onProgress: (msg: string) => syncSpinner.update(msg) };
          const data = await fetchCycleData(client, profile.projectKey, selected.key, progress);
          syncSpinner.update("Building snapshot...");
          const snapshot = buildSnapshot(profile.projectKey, selected.key, data);
          const outputPath = `${selected.key}.json`;
          writeSnapshot(outputPath, snapshot);

          syncSpinner.stop(
            `Snapshot saved to ${outputPath} (${snapshot.testCases.length} test cases)`,
          );
          process.stderr.write(`\nRun: zephyr play ${outputPath}\n`);
          return;
        }

        const filter = options.filter ? parseFilter(options.filter) : undefined;

        renderPlayTUI({
          filePath: file,
          client,
          projectKey: profile.projectKey,
          filter,
          jiraBaseUrl: profile.jiraBaseUrl,
        });
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
