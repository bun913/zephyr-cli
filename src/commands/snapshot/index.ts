import type { Command } from "commander";
import { registerRecordCommand } from "./record";
import { registerSortCommand } from "./sort";
import { registerSyncCommand } from "./sync";

export function registerSnapshotCommand(program: Command): void {
  const snapshot = program.command("snapshot").description("Manage test cycle snapshots");

  registerSyncCommand(snapshot);
  registerSortCommand(snapshot);
  registerRecordCommand(snapshot);
}
