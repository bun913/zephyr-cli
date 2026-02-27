import type { SnapshotTestCase } from "../snapshot/types";

export type FilterSpec =
  | { kind: "unexecuted" }
  | { kind: "folder"; pattern: string }
  | { kind: "status"; name: string };

export function parseFilter(raw: string): FilterSpec {
  if (raw === "unexecuted") {
    return { kind: "unexecuted" };
  }

  if (raw.startsWith("folder=")) {
    const pattern = raw.slice("folder=".length);
    if (!pattern) {
      throw new Error("Filter 'folder=' requires a pattern value");
    }
    return { kind: "folder", pattern };
  }

  if (raw.startsWith("status=")) {
    const name = raw.slice("status=".length);
    if (!name) {
      throw new Error("Filter 'status=' requires a status name");
    }
    return { kind: "status", name };
  }

  throw new Error(
    `Unknown filter: "${raw}". Expected: unexecuted, folder=<pattern>, status=<name>`,
  );
}

export function applyFilter(testCases: SnapshotTestCase[], filter?: FilterSpec): number[] {
  const indices: number[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    if (tc.excluded) continue;

    if (!filter) {
      indices.push(i);
      continue;
    }

    switch (filter.kind) {
      case "unexecuted":
        if (tc.execution.status === null || tc.execution.status === "Not Executed") {
          indices.push(i);
        }
        break;
      case "folder":
        if (tc.folderPath.toLowerCase().includes(filter.pattern.toLowerCase())) {
          indices.push(i);
        }
        break;
      case "status":
        if (tc.execution.status === filter.name) {
          indices.push(i);
        }
        break;
    }
  }

  return indices;
}
