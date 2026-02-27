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
      {/* Left: cycle info + nav keys */}
      <Box width="50%" flexDirection="column">
        <Text>
          {snapshot.testCycleKey}: {snapshot.testCycleName}
          {isLoading ? " ⏳" : ""}
        </Text>
        {pendingPrefix ? (
          <Text color="cyan">
            {pendingPrefix === "g" && "g→ g:top"}
            {pendingPrefix === "z" && "z→ z:center t:top"}
            {pendingPrefix === "s" && "s→ f:folder s:status k:key n:name o:original c:created"}
          </Text>
        ) : (
          <Text dimColor>
            {searchQuery ? (
              <>
                <Text color="yellow">/{searchQuery}</Text> n/N{" "}
              </>
            ) : (
              "/:search "
            )}
            s:sort {activePanel === "right" ? "h:back" : "l:detail .:fold"}
          </Text>
        )}
      </Box>
      {/* Right: stats + action keys */}
      <Box width="50%" flexDirection="column">
        <Text>
          <Text color="green">{stats.pass} Pass</Text> <Text color="red">{stats.fail} Fail</Text>{" "}
          <Text color="yellow">{stats.blocked} Blk</Text>{" "}
          <Text dimColor>{stats.total - stats.pass - stats.fail - stats.blocked} ---</Text>
        </Text>
        {syncMessage ? (
          <Text color="cyan">{syncMessage}</Text>
        ) : errorMessage ? (
          <Text color="red">{errorMessage}</Text>
        ) : (
          <Text dimColor>
            {activePanel === "right" ? "p/f/b:step P/F/B:case" : "p/f/b:all"} o:open player e:edit
            case r:reload R:reload all
          </Text>
        )}
      </Box>
    </Box>
  );
}
