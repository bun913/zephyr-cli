import type { SnapshotTestCase } from "../../../snapshot/types";

export type FlatListItem =
  | {
      type: "folder";
      path: string;
      name: string;
      depth: number;
      childCount: number;
    }
  | {
      type: "testCase";
      index: number;
      depth: number;
      testCase: SnapshotTestCase;
    };

export type InputMode =
  | { kind: "stepActualResult"; stepIndex: number; status: string }
  | { kind: "executionComment"; status: string };

export interface TreeNode {
  name: string;
  fullPath: string;
  children: TreeNode[];
  testCases: number[];
}
