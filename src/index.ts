#!/usr/bin/env node

import { Command } from "commander";
import { registerFolderCommand } from "./commands/folder";
import { registerTestcaseCommand } from "./commands/testcase";
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
    .version("0.1.0")
    .option("-p, --profile <name>", "Profile name to use", "default")
    .option("-c, --config <path>", "Custom configuration file path")
    .option("--text", "Output in human-readable text format (default is JSON)")
    .option("--verbose", "Show detailed logging output");

  // Register commands
  registerTestcaseCommand(program);
  registerFolderCommand(program);
  registerTestStepCommand(program);

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
