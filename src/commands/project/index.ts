/**
 * Project command registration
 */

import type { Command } from "commander";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";

/**
 * Register project command and subcommands
 */
export function registerProjectCommand(program: Command): void {
  const project = program.command("project").description("Manage projects");

  registerListCommand(project);
  registerGetCommand(project);
}
