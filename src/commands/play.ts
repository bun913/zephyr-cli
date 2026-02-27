import type { Command } from "commander";
import { getProfile, loadConfig } from "../config/manager";
import type { GlobalOptions } from "../config/types";
import { parseFilter } from "../play/filter";
import { renderPlayTUI } from "../play/tui/App";
import { createClient } from "../utils/client";
import { formatError } from "../utils/error";
import { logger, setLoggerVerbose } from "../utils/logger";

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
