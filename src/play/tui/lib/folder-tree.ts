import type { SnapshotTestCase } from "../../../snapshot/types";
import type { FlatListItem, TreeNode } from "./types";

export function buildFolderTree(
  testCases: SnapshotTestCase[],
  filteredIndices: number[],
): TreeNode[] {
  const root: TreeNode[] = [];

  for (const idx of filteredIndices) {
    const tc = testCases[idx];
    const path = tc.folderPath || "/";
    const segments = path === "/" ? ["/"] : path.split("/").filter(Boolean);

    let current = root;
    let fullPath = "";

    for (const segment of segments) {
      fullPath = fullPath ? `${fullPath}/${segment}` : `/${segment}`;
      let node = current.find((n) => n.name === segment);
      if (!node) {
        node = { name: segment, fullPath, children: [], testCases: [] };
        current.push(node);
      }
      current = node.children;
    }

    // Attach test case to the deepest folder
    const leafNode = findNode(root, fullPath);
    if (leafNode) {
      leafNode.testCases.push(idx);
    }
  }

  return root;
}

function findNode(nodes: TreeNode[], fullPath: string): TreeNode | null {
  for (const node of nodes) {
    if (node.fullPath === fullPath) return node;
    const found = findNode(node.children, fullPath);
    if (found) return found;
  }
  return null;
}

function countDescendants(node: TreeNode): number {
  let count = node.testCases.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

export function flattenTree(
  nodes: TreeNode[],
  expandedFolders: Set<string>,
  testCases: SnapshotTestCase[],
  depth = 0,
): FlatListItem[] {
  const items: FlatListItem[] = [];

  for (const node of nodes) {
    const isExpanded = expandedFolders.has(node.fullPath);

    items.push({
      type: "folder",
      path: node.fullPath,
      name: node.name,
      depth,
      childCount: countDescendants(node),
    });

    if (isExpanded) {
      // Add test cases first at this folder level
      for (const tcIdx of node.testCases) {
        const tc = testCases[tcIdx];
        items.push({
          type: "testCase",
          index: tcIdx,
          depth: depth + 1,
          testCase: tc,
        });
      }

      // Add child folders after test cases
      items.push(...flattenTree(node.children, expandedFolders, testCases, depth + 1));
    }
  }

  return items;
}
