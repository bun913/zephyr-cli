#!/usr/bin/env node

import { Command } from "commander";
import { registerEnvironmentCommand } from "./commands/environment";
import { registerFolderCommand } from "./commands/folder";
import { registerIssueLinkCommand } from "./commands/issuelink";
import { registerPriorityCommand } from "./commands/priority";
import { registerProjectCommand } from "./commands/project";
import { registerStatusCommand } from "./commands/status";
import { registerTestcaseCommand } from "./commands/testcase";
import { registerTestCycleCommand } from "./commands/testcycle";
import { registerTestExecutionCommand } from "./commands/testexecution";
import { registerTestPlanCommand } from "./commands/testplan";
import { registerTestStepCommand } from "./commands/teststep";
import { logger } from "./utils/logger";

/**
 * Main CLI entry point
 */
function main() {
  const program = new Command();

  program
    .name("zephyr")
    .description("CLI tool for Zephyr Scale API")
    .version("0.2.3")
    .option("-p, --profile <name>", "Profile name to use", "default")
    .option("-c, --config <path>", "Custom configuration file path")
    .option("--text", "Output in human-readable text format (default is JSON)")
    .option("--verbose", "Show detailed logging output");

  // Register commands
  registerTestcaseCommand(program);
  registerTestCycleCommand(program);
  registerTestExecutionCommand(program);
  registerTestPlanCommand(program);
  registerFolderCommand(program);
  registerTestStepCommand(program);
  registerEnvironmentCommand(program);
  registerStatusCommand(program);
  registerPriorityCommand(program);
  registerProjectCommand(program);
  registerIssueLinkCommand(program);

  // Parse arguments
  program.parse(process.argv);
}

// Run the CLI
try {
  main();
} catch (error) {
  logger.error(`Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(1);
}
