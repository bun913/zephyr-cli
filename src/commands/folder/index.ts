/**
 * Folder command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";

/**
 * Register folder command and subcommands
 */
export function registerFolderCommand(program: Command): void {
  const folder = program.command("folder").description("Manage folders");

  // Register subcommands
  registerListCommand(folder);
  registerGetCommand(folder);
  registerCreateCommand(folder);
}
