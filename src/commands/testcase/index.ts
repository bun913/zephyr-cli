/**
 * Testcase command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";
import { registerTestStepCommand } from "./teststep";
import { registerUpdateCommand } from "./update";

/**
 * Register testcase command and subcommands
 */
export function registerTestcaseCommand(program: Command): void {
  const testcase = program.command("testcase").description("Manage test cases");

  // Register subcommands
  registerListCommand(testcase);
  registerGetCommand(testcase);
  registerCreateCommand(testcase);
  registerUpdateCommand(testcase);
  registerTestStepCommand(testcase);
}
