import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Snapshot } from "./types";

export function readSnapshot(filePath: string): Snapshot {
  if (!existsSync(filePath)) {
    throw new Error(`Snapshot file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");
  const data = JSON.parse(content) as Snapshot;

  if (!data.version) {
    throw new Error("Invalid snapshot file: missing version field");
  }

  return data;
}

export function writeSnapshot(filePath: string, snapshot: Snapshot): void {
  writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
}
