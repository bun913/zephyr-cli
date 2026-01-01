/**
 * Status command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";

/**
 * Register status command and subcommands
 */
export function registerStatusCommand(program: Command): void {
  const status = program.command("status").description("Manage statuses");

  registerListCommand(status);
  registerGetCommand(status);
  registerCreateCommand(status);
}
