/**
 * Environment command registration
 */

import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerGetCommand } from "./get";
import { registerListCommand } from "./list";
import { registerUpdateCommand } from "./update";

/**
 * Register environment command and subcommands
 */
export function registerEnvironmentCommand(program: Command): void {
  const environment = program.command("environment").description("Manage test environments");

  registerListCommand(environment);
  registerGetCommand(environment);
  registerCreateCommand(environment);
  registerUpdateCommand(environment);
}
