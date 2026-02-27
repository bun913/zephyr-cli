import { useCallback, useMemo, useState } from "react";
import type { Snapshot, SnapshotTestCase } from "../../../snapshot/types";
import { buildFolderTree, flattenTree } from "../lib/folder-tree";
import type { FlatListItem, InputMode, TreeNode } from "../lib/types";

export interface SnapshotState {
  snapshot: Snapshot;
  filteredIndices: number[];
  treeNodes: TreeNode[];
  flatListItems: FlatListItem[];
  leftCursor: number;
  expandedFolders: Set<string>;
  rightCursor: number;
  activePanel: "left" | "right";
  inputMode: InputMode | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface SnapshotActions {
  moveLeftCursor: (delta: number) => void;
  moveRightCursor: (delta: number) => void;
  toggleFolder: (path: string) => void;
  setActivePanel: (panel: "left" | "right") => void;
  setInputMode: (mode: InputMode | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
  updateSnapshot: (snapshot: Snapshot) => void;
  getSelectedTestCase: () => { testCase: SnapshotTestCase; index: number } | null;
}

export function useSnapshotState(
  initialSnapshot: Snapshot,
  filteredIndices: number[],
): [SnapshotState, SnapshotActions] {
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSnapshot);
  const [leftCursor, setLeftCursor] = useState(0);
  const [rightCursor, setRightCursor] = useState(0);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activePanel, setActivePanel] = useState<"left" | "right">("left");
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  const treeNodes = useMemo(
    () => buildFolderTree(snapshot.testCases, filteredIndices),
    [snapshot.testCases, filteredIndices],
  );

  const flatListItems = useMemo(
    () => flattenTree(treeNodes, expandedFolders, snapshot.testCases),
    [treeNodes, expandedFolders, snapshot.testCases],
  );

  const moveLeftCursor = useCallback(
    (delta: number) => {
      setLeftCursor((prev) => {
        const next = prev + delta;
        if (next < 0) return 0;
        if (next >= flatListItems.length) return flatListItems.length - 1;
        return next;
      });
    },
    [flatListItems.length],
  );

  const getSelectedTestCase = useCallback((): {
    testCase: SnapshotTestCase;
    index: number;
  } | null => {
    const item = flatListItems[leftCursor];
    if (!item) return null;
    if (item.type === "testCase") {
      return { testCase: item.testCase, index: item.index };
    }
    return null;
  }, [flatListItems, leftCursor]);

  const moveRightCursor = useCallback(
    (delta: number) => {
      const selected = getSelectedTestCase();
      if (!selected) return;
      setRightCursor((prev) => {
        const maxIdx = selected.testCase.steps.length - 1;
        const next = prev + delta;
        if (next < 0) return 0;
        if (next > maxIdx) return Math.max(0, maxIdx);
        return next;
      });
    },
    [getSelectedTestCase],
  );

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const updateSnapshot = useCallback((newSnapshot: Snapshot) => {
    setSnapshot(newSnapshot);
  }, []);

  const state: SnapshotState = {
    snapshot,
    filteredIndices,
    treeNodes,
    flatListItems,
    leftCursor,
    expandedFolders,
    rightCursor,
    activePanel,
    inputMode,
    isLoading,
    errorMessage,
  };

  const actions: SnapshotActions = {
    moveLeftCursor,
    moveRightCursor,
    toggleFolder,
    setActivePanel,
    setInputMode,
    setLoading,
    setError,
    updateSnapshot,
    getSelectedTestCase,
  };

  return [state, actions];
}
