import type { SnapshotTestCase } from "./types";

export function calcOriginalIndex(
  zephyrOrder: string[],
  newKey: string,
  localCases: SnapshotTestCase[],
): number {
  const position = zephyrOrder.indexOf(newKey);
  if (position === -1) {
    // Key not found in zephyr order; append after max
    const maxIndex = localCases.reduce((max, c) => Math.max(max, c.originalIndex), -1);
    return maxIndex + 1;
  }

  const localMap = new Map<string, SnapshotTestCase>();
  for (const c of localCases) {
    localMap.set(c.key, c);
  }

  // Search backward for nearest existing key
  let before: number | null = null;
  for (let i = position - 1; i >= 0; i--) {
    const key = zephyrOrder[i];
    if (key === undefined) continue;
    const existing = localMap.get(key);
    if (existing) {
      before = existing.originalIndex;
      break;
    }
  }

  // Search forward for nearest existing key
  let after: number | null = null;
  for (let i = position + 1; i < zephyrOrder.length; i++) {
    const key = zephyrOrder[i];
    if (key === undefined) continue;
    const existing = localMap.get(key);
    if (existing) {
      after = existing.originalIndex;
      break;
    }
  }

  if (before !== null && after !== null) {
    return (before + after) / 2;
  }
  if (before !== null) {
    return before + 1;
  }
  if (after !== null) {
    return after - 1;
  }

  // No neighbors found
  return position;
}
