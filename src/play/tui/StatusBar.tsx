import { Box, Text } from "ink";
import type { Snapshot } from "../../snapshot/types";

interface StatusBarProps {
  snapshot: Snapshot;
  isLoading: boolean;
  errorMessage: string | null;
  activePanel: "left" | "right";
  stats: { pass: number; fail: number; blocked: number; total: number };
  syncMessage?: string;
  searchQuery?: string;
  pendingPrefix?: string;
}

export function StatusBar({
  snapshot,
  isLoading,
  errorMessage,
  activePanel,
  stats,
  syncMessage,
  searchQuery,
  pendingPrefix,
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
        {pendingPrefix ? (
          <Text color="cyan">
            {pendingPrefix === "g" && "g→ g:top"}
            {pendingPrefix === "z" && "z→ z:center t:top"}
          </Text>
        ) : syncMessage ? (
          <Text color="cyan">{syncMessage}</Text>
        ) : errorMessage ? (
          <Text color="red">{errorMessage}</Text>
        ) : (
          <Text dimColor>
            {searchQuery ? (
              <>
                <Text color="yellow">/{searchQuery}</Text> n/N:next/prev /:new{" "}
              </>
            ) : (
              "/:search "
            )}
            gg/G:top/end zz/zt o:open S:sync{" "}
            {activePanel === "right" ? "p/f/b:step Shift:case" : "p/f/b:all l:detail"}
          </Text>
        )}
      </Box>
    </Box>
  );
}
