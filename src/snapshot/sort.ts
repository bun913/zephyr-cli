import type { Snapshot, SnapshotTestCase } from "./types";

export type SortKey = "key" | "created" | "name" | "folder" | "status" | "original";

const STATUS_PRIORITY: Record<string, number> = {
  "Not Executed": 0,
  Fail: 1,
  Blocked: 2,
  Pass: 3,
};

function getStatusPriority(status: string | null): number {
  if (status === null) return 0;
  return STATUS_PRIORITY[status] ?? 0;
}

function parseKey(key: string): { prefix: string; num: number } {
  const match = key.match(/^(.+?)-T(\d+)$/);
  if (match) {
    return { prefix: match[1] ?? key, num: Number.parseInt(match[2] ?? "0", 10) };
  }
  return { prefix: key, num: 0 };
}

function compareKeys(a: string, b: string): number {
  const pa = parseKey(a);
  const pb = parseKey(b);
  if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix);
  return pa.num - pb.num;
}

function getComparator(by: SortKey): (a: SnapshotTestCase, b: SnapshotTestCase) => number {
  switch (by) {
    case "key":
      return (a, b) => compareKeys(a.key, b.key);
    case "created":
      return (a, b) => a.createdAt.localeCompare(b.createdAt);
    case "name":
      return (a, b) => a.name.localeCompare(b.name);
    case "folder":
      return (a, b) => {
        const folderCmp = a.folderPath.localeCompare(b.folderPath);
        if (folderCmp !== 0) return folderCmp;
        return compareKeys(a.key, b.key);
      };
    case "status":
      return (a, b) => {
        const sa = getStatusPriority(a.execution.status);
        const sb = getStatusPriority(b.execution.status);
        if (sa !== sb) return sa - sb;
        return compareKeys(a.key, b.key);
      };
    case "original":
      return (a, b) => a.originalIndex - b.originalIndex;
  }
}

export function sortSnapshot(snapshot: Snapshot, by: SortKey): Snapshot {
  snapshot.testCases.sort(getComparator(by));
  return snapshot;
}
