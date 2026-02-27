import { Box, Text } from "ink";
import { useRef } from "react";
import type { FlatListItem } from "./lib/types";

interface LeftPanelProps {
  items: FlatListItem[];
  cursor: number;
  isFocused: boolean;
  expandedFolders: Set<string>;
  height: number;
  scrollHint?: "center" | "top" | null;
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

export function LeftPanel({
  items,
  cursor,
  isFocused,
  expandedFolders,
  height,
  scrollHint,
}: LeftPanelProps) {
  // Viewport scrolling with persistent offset
  const visibleCount = Math.max(1, height - 2);
  const scrollRef = useRef(0);

  if (scrollHint === "center") {
    scrollRef.current = Math.max(0, cursor - Math.floor(visibleCount / 2));
  } else if (scrollHint === "top") {
    scrollRef.current = cursor;
  } else {
    // Only adjust when cursor goes out of visible range
    if (cursor < scrollRef.current) {
      scrollRef.current = cursor;
    } else if (cursor >= scrollRef.current + visibleCount) {
      scrollRef.current = cursor - visibleCount + 1;
    }
  }
  // Clamp
  scrollRef.current = Math.min(scrollRef.current, Math.max(0, items.length - visibleCount));
  scrollRef.current = Math.max(0, scrollRef.current);

  const scrollOffset = scrollRef.current;
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
          const icon = isExpanded ? "📂" : "📁";
          return (
            <Box key={`folder-${item.path}`}>
              <Text
                backgroundColor={isSelected && isFocused ? "cyan" : undefined}
                color={isSelected && isFocused ? "black" : undefined}
              >
                {indent}
                {icon} {item.name} ({item.childCount})
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
