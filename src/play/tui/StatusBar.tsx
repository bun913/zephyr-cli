import { Box, Text } from "ink";
import type { Snapshot } from "../../snapshot/types";

interface StatusBarProps {
  snapshot: Snapshot;
  isLoading: boolean;
  errorMessage: string | null;
  activePanel: "left" | "right";
  stats: { pass: number; fail: number; blocked: number; total: number };
}

export function StatusBar({
  snapshot,
  isLoading,
  errorMessage,
  activePanel,
  stats,
}: StatusBarProps) {
  return (
    <Box
      flexDirection="row"
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    >
      <Box width="40%">
        <Text>
          {snapshot.testCycleKey}: {snapshot.testCycleName}
          {isLoading ? " ⏳" : ""}
        </Text>
      </Box>
      <Box width="30%">
        <Text>
          <Text color="green">{stats.pass} Pass</Text> <Text color="red">{stats.fail} Fail</Text>{" "}
          <Text color="yellow">{stats.blocked} Blk</Text>{" "}
          <Text dimColor>{stats.total - stats.pass - stats.fail - stats.blocked} ---</Text>
        </Text>
      </Box>
      <Box width="30%">
        {errorMessage ? (
          <Text color="red">{errorMessage}</Text>
        ) : (
          <Text dimColor>
            Tab:switch{" "}
            {activePanel === "right" ? "p/f/b:step  P/F/B:case" : "Enter:expand  j/k:move"}
          </Text>
        )}
      </Box>
    </Box>
  );
}
