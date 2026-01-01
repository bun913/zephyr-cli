/**
 * Priority command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";

/**
 * Register priority command and subcommands
 */
export function registerPriorityCommand(program: Command): void {
  const priority = program.command("priority").description("Manage priorities");

  registerListCommand(priority);
  registerGetCommand(priority);
  registerCreateCommand(priority);
}
