/**
 * Testcycle command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";
import { registerUpdateCommand } from "./update";

/**
 * Register testcycle command and subcommands
 */
export function registerTestCycleCommand(program: Command): void {
  const testcycle = program.command("testcycle").description("Manage test cycles");

  // Register subcommands
  registerListCommand(testcycle);
  registerGetCommand(testcycle);
  registerCreateCommand(testcycle);
  registerUpdateCommand(testcycle);
}
