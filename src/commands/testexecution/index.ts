/**
 * Testexecution command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";
import { registerUpdateCommand } from "./update";

/**
 * Register testexecution command and subcommands
 */
export function registerTestExecutionCommand(program: Command): void {
  const testexecution = program.command("testexecution").description("Manage test executions");

  // Register subcommands
  registerListCommand(testexecution);
  registerGetCommand(testexecution);
  registerCreateCommand(testexecution);
  registerUpdateCommand(testexecution);
}
