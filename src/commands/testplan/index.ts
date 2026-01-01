/**
 * Testplan command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";

/**
 * Register testplan command and subcommands
 */
export function registerTestPlanCommand(program: Command): void {
  const testplan = program.command("testplan").description("Manage test plans");

  // Register subcommands
  registerListCommand(testplan);
  registerGetCommand(testplan);
  registerCreateCommand(testplan);
}
