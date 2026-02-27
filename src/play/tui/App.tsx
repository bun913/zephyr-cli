import { Box, render, useApp, useInput, useStdout } from "ink";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ZephyrV2Client } from "zephyr-api-client";
import { readSnapshot } from "../../snapshot/file";
import type { Snapshot } from "../../snapshot/types";
import { applyFilter, type FilterSpec } from "../filter";
import { useApiActions } from "./hooks/useApiActions";
import { useSnapshotState } from "./hooks/useSnapshotState";
import { LeftPanel } from "./LeftPanel";
import type { InputMode } from "./lib/types";
import { RightPanel } from "./RightPanel";
import { StatusBar } from "./StatusBar";
import { TextInputOverlay } from "./TextInputOverlay";

interface AppProps {
  filePath: string;
  client: ZephyrV2Client;
  projectKey: string;
  initialSnapshot: Snapshot;
  filteredIndices: number[];
}

function App({ filePath, client, projectKey, initialSnapshot, filteredIndices }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 24;

  const [state, actions] = useSnapshotState(initialSnapshot, filteredIndices);
  const snapshotRef = useRef(state.snapshot);
  snapshotRef.current = state.snapshot;

  const { pushStep, pushExecution } = useApiActions({
    client,
    projectKey,
    filePath,
    getSnapshot: () => snapshotRef.current,
    updateSnapshot: actions.updateSnapshot,
    setLoading: actions.setLoading,
    setError: actions.setError,
  });

  const [pendingInput, setPendingInput] = useState<InputMode | null>(null);

  const selectedTestCase = actions.getSelectedTestCase();

  const stats = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let blocked = 0;
    for (const idx of filteredIndices) {
      const tc = state.snapshot.testCases[idx];
      switch (tc.execution.status) {
        case "Pass":
          pass++;
          break;
        case "Fail":
          fail++;
          break;
        case "Blocked":
          blocked++;
          break;
      }
    }
    return { pass, fail, blocked, total: filteredIndices.length };
  }, [state.snapshot, filteredIndices]);

  const handleInputSubmit = useCallback(
    async (value: string) => {
      if (!pendingInput || !selectedTestCase) {
        setPendingInput(null);
        return;
      }

      if (pendingInput.kind === "stepActualResult") {
        await pushStep(
          selectedTestCase.index,
          pendingInput.stepIndex,
          pendingInput.status,
          value || undefined,
        );
      } else if (pendingInput.kind === "executionComment") {
        await pushExecution(selectedTestCase.index, pendingInput.status, value || undefined);
      }

      setPendingInput(null);
    },
    [pendingInput, selectedTestCase, pushStep, pushExecution],
  );

  const handleInputCancel = useCallback(() => {
    setPendingInput(null);
  }, []);

  useInput(
    (input, key) => {
      // Don't process keys during input mode or loading
      if (pendingInput || state.isLoading) return;

      // Quit
      if (input === "q") {
        exit();
        return;
      }

      // Tab: switch panels
      if (key.tab) {
        actions.setActivePanel(state.activePanel === "left" ? "right" : "left");
        return;
      }

      if (state.activePanel === "left") {
        // Navigation
        if (input === "j" || key.downArrow) {
          actions.moveLeftCursor(1);
        } else if (input === "k" || key.upArrow) {
          actions.moveLeftCursor(-1);
        } else if (key.return || input === " ") {
          const item = state.flatListItems[state.leftCursor];
          if (item?.type === "folder") {
            actions.toggleFolder(item.path);
          } else if (item?.type === "testCase") {
            actions.setActivePanel("right");
          }
        }
      } else if (state.activePanel === "right") {
        if (!selectedTestCase) return;

        // Step navigation
        if (input === "j" || key.downArrow) {
          actions.moveRightCursor(1);
        } else if (input === "k" || key.upArrow) {
          actions.moveRightCursor(-1);
        }
        // Step status: p/f/b
        else if (input === "p" && selectedTestCase.testCase.steps.length > 0) {
          // Pass: immediate push
          pushStep(selectedTestCase.index, state.rightCursor, "Pass");
        } else if (input === "f" && selectedTestCase.testCase.steps.length > 0) {
          setPendingInput({
            kind: "stepActualResult",
            stepIndex: state.rightCursor,
            status: "Fail",
          });
        } else if (input === "b" && selectedTestCase.testCase.steps.length > 0) {
          setPendingInput({
            kind: "stepActualResult",
            stepIndex: state.rightCursor,
            status: "Blocked",
          });
        }
        // Execution status: P/F/B
        else if (input === "P") {
          pushExecution(selectedTestCase.index, "Pass");
        } else if (input === "F") {
          setPendingInput({ kind: "executionComment", status: "Fail" });
        } else if (input === "B") {
          setPendingInput({ kind: "executionComment", status: "Blocked" });
        }
      }
    },
    { isActive: !pendingInput },
  );

  const panelHeight = termHeight - 3; // Reserve for status bar

  return (
    <Box flexDirection="column" height={termHeight}>
      <Box flexDirection="row" height={panelHeight}>
        <LeftPanel
          items={state.flatListItems}
          cursor={state.leftCursor}
          isFocused={state.activePanel === "left" && !pendingInput}
          expandedFolders={state.expandedFolders}
          height={panelHeight}
        />
        <RightPanel
          testCase={selectedTestCase?.testCase ?? null}
          stepCursor={state.rightCursor}
          isFocused={state.activePanel === "right" && !pendingInput}
          height={panelHeight}
        />
      </Box>
      <StatusBar
        snapshot={state.snapshot}
        isLoading={state.isLoading}
        errorMessage={state.errorMessage}
        activePanel={state.activePanel}
        stats={stats}
      />
      {pendingInput && (
        <TextInputOverlay
          inputMode={pendingInput}
          onSubmit={handleInputSubmit}
          onCancel={handleInputCancel}
        />
      )}
    </Box>
  );
}

export interface RenderPlayTUIOptions {
  filePath: string;
  client: ZephyrV2Client;
  projectKey: string;
  filter?: FilterSpec;
}

export function renderPlayTUI(options: RenderPlayTUIOptions): void {
  const { filePath, client, projectKey, filter } = options;

  const snapshot = readSnapshot(filePath);
  const filteredIndices = applyFilter(snapshot.testCases, filter);

  if (filteredIndices.length === 0) {
    console.log("No test cases match the filter.");
    return;
  }

  const instance = render(
    <App
      filePath={filePath}
      client={client}
      projectKey={projectKey}
      initialSnapshot={snapshot}
      filteredIndices={filteredIndices}
    />,
    { exitOnCtrlC: true },
  );

  instance.waitUntilExit().catch(() => {});
}
