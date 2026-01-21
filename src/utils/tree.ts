/**
 * Common tree utilities for folder/testcycle tree commands
 */

/**
 * Tree node structure for output
 */
export interface FolderTreeNode {
  id: number;
  name: string;
  children: FolderTreeNode[];
  testCases: { key: string; name: string }[];
  hasMoreTestCases?: boolean;
}

/**
 * Format tree as text output (recursive helper)
 */
export function formatTreeAsText(nodes: FolderTreeNode[], prefix = ""): string {
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    lines.push(`${prefix}${connector}${node.name}/ (${node.id})`);

    const hasMore = node.hasMoreTestCases ?? false;
    const totalItems = node.children.length + node.testCases.length + (hasMore ? 1 : 0);
    let itemIndex = 0;

    for (const tc of node.testCases) {
      itemIndex++;
      const tcConnector = itemIndex === totalItems ? "└── " : "├── ";
      lines.push(`${prefix}${childPrefix}${tcConnector}${tc.key}: ${tc.name}`);
    }

    if (hasMore) {
      itemIndex++;
      const moreConnector = itemIndex === totalItems ? "└── " : "├── ";
      lines.push(`${prefix}${childPrefix}${moreConnector}...`);
    }

    if (node.children.length > 0) {
      lines.push(formatTreeAsText(node.children, prefix + childPrefix));
    }
  }

  return lines.join("\n");
}

/**
 * Print tree to console in text format
 */
export function printTreeAsText(tree: FolderTreeNode[]): void {
  for (const root of tree) {
    console.log(`${root.name}/ (${root.id})`);
    const hasMore = root.hasMoreTestCases ?? false;
    const totalItems = root.children.length + root.testCases.length + (hasMore ? 1 : 0);
    let itemIndex = 0;

    for (const tc of root.testCases) {
      itemIndex++;
      const connector = itemIndex === totalItems ? "└── " : "├── ";
      console.log(`${connector}${tc.key}: ${tc.name}`);
    }

    if (hasMore) {
      itemIndex++;
      const connector = itemIndex === totalItems ? "└── " : "├── ";
      console.log(`${connector}...`);
    }

    if (root.children.length > 0) {
      console.log(formatTreeAsText(root.children));
    }
  }
}
