import { Box, Text } from "ink";
import type { FlatListItem } from "./lib/types";

interface LeftPanelProps {
  items: FlatListItem[];
  cursor: number;
  isFocused: boolean;
  expandedFolders: Set<string>;
  height: number;
}

function statusColor(status: string | null): string {
  switch (status) {
    case "Pass":
      return "green";
    case "Fail":
      return "red";
    case "Blocked":
      return "yellow";
    default:
      return "gray";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "Pass":
      return "Pass";
    case "Fail":
      return "Fail";
    case "Blocked":
      return "Blk ";
    default:
      return "--- ";
  }
}

export function LeftPanel({ items, cursor, isFocused, expandedFolders, height }: LeftPanelProps) {
  // Viewport scrolling
  const visibleCount = Math.max(1, height - 2);
  let scrollOffset = 0;
  if (cursor >= visibleCount) {
    scrollOffset = cursor - visibleCount + 1;
  }
  const visibleItems = items.slice(scrollOffset, scrollOffset + visibleCount);

  return (
    <Box
      flexDirection="column"
      width="40%"
      borderStyle="single"
      borderColor={isFocused ? "cyan" : "gray"}
    >
      {visibleItems.map((item, vi) => {
        const actualIndex = scrollOffset + vi;
        const isSelected = actualIndex === cursor;
        const indent = "  ".repeat(item.depth);

        if (item.type === "folder") {
          const isExpanded = expandedFolders.has(item.path);
          const arrow = isExpanded ? "v" : ">";
          return (
            <Box key={`folder-${item.path}`}>
              <Text
                backgroundColor={isSelected && isFocused ? "cyan" : undefined}
                color={isSelected && isFocused ? "black" : undefined}
              >
                {indent}
                {arrow} {item.name} ({item.childCount})
              </Text>
            </Box>
          );
        }

        const tc = item.testCase;
        const execStatus = tc.execution.status;
        const marker = execStatus && execStatus !== "Not Executed" ? "●" : "○";
        const displayName = tc.name.length > 25 ? `${tc.name.slice(0, 22)}...` : tc.name;

        return (
          <Box key={`tc-${item.index}`}>
            <Text
              backgroundColor={isSelected && isFocused ? "cyan" : undefined}
              color={isSelected && isFocused ? "black" : undefined}
            >
              {indent}
              <Text color={isSelected && isFocused ? "black" : statusColor(execStatus)}>
                {marker}
              </Text>{" "}
              {tc.key} {displayName}
              {"  "}
              <Text color={isSelected && isFocused ? "black" : statusColor(execStatus)}>
                {statusLabel(execStatus)}
              </Text>
            </Text>
          </Box>
        );
      })}
      {items.length === 0 && (
        <Box>
          <Text dimColor>No test cases</Text>
        </Box>
      )}
    </Box>
  );
}
