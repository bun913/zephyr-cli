/**
 * Teststep command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerListCommand } from "./list";

/**
 * Register 'teststep' command
 */
export function registerTestStepCommand(parent: Command): void {
  const teststepCommand = parent
    .command("teststep")
    .description("Manage test steps for test cases");

  registerListCommand(teststepCommand);
  registerCreateCommand(teststepCommand);
}
