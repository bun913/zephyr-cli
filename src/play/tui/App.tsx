import { execFile } from "node:child_process";
import { Box, render, useApp, useInput, useStdout } from "ink";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ZephyrV2Client } from "zephyr-api-client";
import { readSnapshot, writeSnapshot } from "../../snapshot/file";
import { type SortKey, sortSnapshot } from "../../snapshot/sort";
import type { Snapshot } from "../../snapshot/types";
import { applyFilter, type FilterSpec } from "../filter";
import { useApiActions } from "./hooks/useApiActions";
import { useSnapshotState } from "./hooks/useSnapshotState";
import { LeftPanel } from "./LeftPanel";
import type { InputMode } from "./lib/types";
import { RightPanel } from "./RightPanel";
import { StatusBar } from "./StatusBar";
import { TextInputOverlay } from "./TextInputOverlay";

type SyncPhase = "confirm" | "syncing" | null;

interface AppProps {
  filePath: string;
  client: ZephyrV2Client;
  projectKey: string;
  initialSnapshot: Snapshot;
  filteredIndices: number[];
  filter?: FilterSpec;
  jiraBaseUrl?: string;
}

function App({
  filePath,
  client,
  projectKey,
  initialSnapshot,
  filteredIndices: initialFilteredIndices,
  filter,
  jiraBaseUrl,
}: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 24;

  const [currentFilteredIndices, setCurrentFilteredIndices] =
    useState<number[]>(initialFilteredIndices);
  const [searchQuery, setSearchQuery] = useState("");

  const [state, actions] = useSnapshotState(initialSnapshot, currentFilteredIndices);
  const snapshotRef = useRef(state.snapshot);
  snapshotRef.current = state.snapshot;

  // Search: compute matching flatListItem indices for n/N jump
  const matchIndices = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    const indices: number[] = [];
    for (let i = 0; i < state.flatListItems.length; i++) {
      const item = state.flatListItems[i];
      if (item.type === "testCase") {
        const tc = item.testCase;
        if (
          tc.key.toLowerCase().includes(q) ||
          tc.name.toLowerCase().includes(q) ||
          tc.folderPath.toLowerCase().includes(q)
        ) {
          indices.push(i);
        }
      }
    }
    return indices;
  }, [searchQuery, state.flatListItems]);

  const { pushStep, pushAllSteps, pushExecution, syncSnapshot, reloadSingleTestCase } =
    useApiActions({
      client,
      projectKey,
      filePath,
      getSnapshot: () => snapshotRef.current,
      updateSnapshot: actions.updateSnapshot,
      setLoading: actions.setLoading,
      setError: actions.setError,
    });

  const [pendingInput, setPendingInput] = useState<InputMode | null>(null);
  const [syncPhase, setSyncPhase] = useState<SyncPhase>(null);
  const [syncMessage, setSyncMessage] = useState<string | undefined>(undefined);
  const syncMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrollHint, setScrollHint] = useState<"center" | "top" | null>(null);
  const [zPrefix, setZPrefix] = useState(false);
  const [gPrefix, setGPrefix] = useState(false);
  const [sPrefix, setSPrefix] = useState(false);

  const selectedTestCase = actions.getSelectedTestCase();

  const stats = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let blocked = 0;
    for (const idx of currentFilteredIndices) {
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
    return { pass, fail, blocked, total: currentFilteredIndices.length };
  }, [state.snapshot, currentFilteredIndices]);

  const runSync = useCallback(async () => {
    setSyncPhase("syncing");
    setSyncMessage("Syncing...");
    try {
      const result = await syncSnapshot((msg) => setSyncMessage(msg));
      const newIndices = applyFilter(result.snapshot.testCases, filter);
      setCurrentFilteredIndices(newIndices);
      setSyncPhase(null);
      setSyncMessage(
        `Synced: +${result.added.length} -${result.removed.length} ~${result.updated.length}`,
      );
      if (syncMessageTimerRef.current) clearTimeout(syncMessageTimerRef.current);
      syncMessageTimerRef.current = setTimeout(() => setSyncMessage(undefined), 5000);
    } catch (error) {
      setSyncPhase(null);
      setSyncMessage(undefined);
      actions.setError(`Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [syncSnapshot, filter, actions]);

  const handleInputSubmit = useCallback(
    async (value: string) => {
      if (!pendingInput) return;

      if (pendingInput.kind === "search") {
        setSearchQuery(value);
        // Jump to first match
        if (value) {
          const q = value.toLowerCase();
          for (let i = 0; i < state.flatListItems.length; i++) {
            const item = state.flatListItems[i];
            if (item.type === "testCase") {
              const tc = item.testCase;
              if (
                tc.key.toLowerCase().includes(q) ||
                tc.name.toLowerCase().includes(q) ||
                tc.folderPath.toLowerCase().includes(q)
              ) {
                actions.moveLeftCursor(i - state.leftCursor);
                break;
              }
            }
          }
        }
        setPendingInput(null);
        return;
      }

      if (!selectedTestCase) {
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
    [
      pendingInput,
      selectedTestCase,
      pushStep,
      pushExecution,
      state.flatListItems,
      state.leftCursor,
      actions,
    ],
  );

  const handleInputCancel = useCallback(() => {
    setPendingInput(null);
  }, []);

  // Sync confirm handler
  useInput(
    (input, key) => {
      if (input === "y") {
        runSync();
      } else if (input === "n" || key.escape) {
        setSyncPhase(null);
        setSyncMessage(undefined);
      }
    },
    { isActive: syncPhase === "confirm" },
  );

  useInput(
    (input, key) => {
      // Don't process keys during input mode, loading, or sync
      if (pendingInput || state.isLoading || syncPhase) return;

      // Quit
      if (input === "q") {
        exit();
        return;
      }

      // s prefix for sort
      if (sPrefix) {
        setSPrefix(false);
        const sortKeyMap: Record<string, SortKey> = {
          f: "folder",
          s: "status",
          k: "key",
          n: "name",
          o: "original",
          c: "created",
        };
        const sortKey = sortKeyMap[input];
        if (sortKey) {
          const sorted = sortSnapshot({ ...state.snapshot }, sortKey);
          writeSnapshot(filePath, sorted);
          const newIndices = applyFilter(sorted.testCases, filter);
          setCurrentFilteredIndices(newIndices);
          actions.updateSnapshot(sorted);
          setSyncMessage(`Sorted by ${sortKey}`);
          if (syncMessageTimerRef.current) clearTimeout(syncMessageTimerRef.current);
          syncMessageTimerRef.current = setTimeout(() => setSyncMessage(undefined), 3000);
        }
        return;
      }
      if (input === "s") {
        setSPrefix(true);
        return;
      }

      // g prefix for gg (go to top)
      if (gPrefix) {
        setGPrefix(false);
        if (input === "g") {
          actions.moveLeftCursor(-state.leftCursor);
        }
        return;
      }
      if (input === "g") {
        setGPrefix(true);
        return;
      }
      // G: go to bottom
      if (input === "G") {
        actions.moveLeftCursor(state.flatListItems.length - 1 - state.leftCursor);
        return;
      }

      // z prefix for zz/zt
      if (zPrefix) {
        setZPrefix(false);
        if (input === "z") {
          setScrollHint("center");
          // Clear after one render
          setTimeout(() => setScrollHint(null), 0);
          return;
        }
        if (input === "t") {
          setScrollHint("top");
          setTimeout(() => setScrollHint(null), 0);
          return;
        }
        return; // unknown z-combo, ignore
      }
      if (input === "z") {
        setZPrefix(true);
        return;
      }

      // Open in browser: o
      if (input === "o" && selectedTestCase) {
        if (!jiraBaseUrl) {
          actions.setError("jiraBaseUrl not set in profile");
        } else {
          const base = jiraBaseUrl.replace(/\/+$/, "");
          const cycleKey = state.snapshot.testCycleKey;
          const testCaseKey = selectedTestCase.testCase.key;
          const url = `${base}/projects/${projectKey}?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page#!/v2/testPlayer/${cycleKey}`;

          // Copy test case key to clipboard for pasting into the search box
          if (process.platform === "darwin") {
            execFile(
              "pbcopy",
              [],
              (err) => err && actions.setError(`Clipboard failed: ${err.message}`),
            ).stdin?.end(testCaseKey);
          } else if (process.platform === "win32") {
            execFile(
              "clip",
              [],
              (err) => err && actions.setError(`Clipboard failed: ${err.message}`),
            ).stdin?.end(testCaseKey);
          } else {
            execFile(
              "xclip",
              ["-selection", "clipboard"],
              (err) => err && actions.setError(`Clipboard failed: ${err.message}`),
            ).stdin?.end(testCaseKey);
          }

          if (process.platform === "darwin") {
            execFile("open", [url]);
          } else if (process.platform === "win32") {
            execFile("cmd", ["/c", "start", "", url]);
          } else {
            execFile("xdg-open", [url]);
          }

          setSyncMessage(`Copied "${testCaseKey}" - paste in Search box`);
          if (syncMessageTimerRef.current) clearTimeout(syncMessageTimerRef.current);
          syncMessageTimerRef.current = setTimeout(() => setSyncMessage(undefined), 10000);
        }
        return;
      }

      // Edit test case in browser: e
      if (input === "e" && selectedTestCase) {
        if (!jiraBaseUrl) {
          actions.setError("jiraBaseUrl not set in profile");
        } else {
          const base = jiraBaseUrl.replace(/\/+$/, "");
          const testCaseKey = selectedTestCase.testCase.key;
          const url = `${base}/projects/${projectKey}?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page#!/v2/testCase/${testCaseKey}`;
          if (process.platform === "darwin") {
            execFile("open", [url]);
          } else if (process.platform === "win32") {
            execFile("cmd", ["/c", "start", "", url]);
          } else {
            execFile("xdg-open", [url]);
          }
        }
        return;
      }

      // Reload single test case: r
      if (input === "r" && selectedTestCase) {
        const tc = selectedTestCase.testCase;
        setSyncMessage(`Reloading ${tc.key}...`);
        reloadSingleTestCase(tc.key, tc.execution.id)
          .then((updated) => {
            const newIndices = applyFilter(updated.testCases, filter);
            setCurrentFilteredIndices(newIndices);
            setSyncMessage(`Reloaded: ${tc.key}`);
            if (syncMessageTimerRef.current) clearTimeout(syncMessageTimerRef.current);
            syncMessageTimerRef.current = setTimeout(() => setSyncMessage(undefined), 3000);
          })
          .catch((error) => {
            setSyncMessage(undefined);
            actions.setError(
              `Reload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          });
        return;
      }

      // Reload all (full sync): R
      if (input === "R") {
        setSyncPhase("confirm");
        setSyncMessage("Reload all? (y/n)");
        return;
      }

      // Search: /
      if (input === "/") {
        setPendingInput({ kind: "search" });
        return;
      }

      // Search navigation: n/N to jump between matches
      if (matchIndices.length > 0 && input === "n") {
        const target = matchIndices.find((i) => i > state.leftCursor) ?? matchIndices[0];
        if (target !== undefined) actions.moveLeftCursor(target - state.leftCursor);
        return;
      }
      if (matchIndices.length > 0 && input === "N") {
        const target =
          [...matchIndices].reverse().find((i) => i < state.leftCursor) ??
          matchIndices[matchIndices.length - 1];
        if (target !== undefined) actions.moveLeftCursor(target - state.leftCursor);
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
        } else if (input === ".") {
          actions.toggleAllFolders();
        } else if (input === "l" || key.rightArrow) {
          if (selectedTestCase) {
            actions.setActivePanel("right");
          }
        } else if (key.return || input === " ") {
          const item = state.flatListItems[state.leftCursor];
          if (item?.type === "folder") {
            actions.toggleFolder(item.path);
          } else if (item?.type === "testCase") {
            actions.setActivePanel("right");
          }
        }
        // Bulk step status: p/f/b on selected test case
        else if (input === "p" && selectedTestCase) {
          pushAllSteps(selectedTestCase.index, "Pass");
        } else if (input === "f" && selectedTestCase) {
          pushAllSteps(selectedTestCase.index, "Fail");
        } else if (input === "b" && selectedTestCase) {
          pushAllSteps(selectedTestCase.index, "Blocked");
        }
      } else if (state.activePanel === "right") {
        if (!selectedTestCase) return;

        // Back to left panel
        if (input === "h" || key.leftArrow) {
          actions.setActivePanel("left");
          return;
        }

        // Step navigation
        if (input === "j" || key.downArrow) {
          actions.moveRightCursor(1);
        } else if (input === "k" || key.upArrow) {
          actions.moveRightCursor(-1);
        }
        // Step status: p/f/b (immediate)
        else if (input === "p" && selectedTestCase.testCase.steps.length > 0) {
          pushStep(selectedTestCase.index, state.rightCursor, "Pass");
        } else if (input === "f" && selectedTestCase.testCase.steps.length > 0) {
          pushStep(selectedTestCase.index, state.rightCursor, "Fail");
        } else if (input === "b" && selectedTestCase.testCase.steps.length > 0) {
          pushStep(selectedTestCase.index, state.rightCursor, "Blocked");
        }
        // Enter: input text for step actualResult
        else if (key.return && selectedTestCase.testCase.steps.length > 0) {
          setPendingInput({
            kind: "stepActualResult",
            stepIndex: state.rightCursor,
            status:
              selectedTestCase.testCase.steps[state.rightCursor].result.status ?? "Not Executed",
          });
        }
        // Execution status: P/F/B (immediate)
        else if (input === "P") {
          pushExecution(selectedTestCase.index, "Pass");
        } else if (input === "F") {
          pushExecution(selectedTestCase.index, "Fail");
        } else if (input === "B") {
          pushExecution(selectedTestCase.index, "Blocked");
        }
      }
    },
    { isActive: !pendingInput && syncPhase !== "confirm" },
  );

  const panelHeight = termHeight - 3; // Reserve for status bar

  return (
    <Box flexDirection="column" height={termHeight}>
      <Box flexDirection="row" height={panelHeight}>
        <LeftPanel
          items={state.flatListItems}
          cursor={state.leftCursor}
          isFocused={state.activePanel === "left" && !pendingInput && !syncPhase}
          expandedFolders={state.expandedFolders}
          height={panelHeight}
          scrollHint={scrollHint}
        />
        <RightPanel
          testCase={selectedTestCase?.testCase ?? null}
          stepCursor={state.rightCursor}
          isFocused={state.activePanel === "right" && !pendingInput && !syncPhase}
          height={panelHeight}
        />
      </Box>
      <StatusBar
        snapshot={state.snapshot}
        isLoading={state.isLoading}
        errorMessage={state.errorMessage}
        activePanel={state.activePanel}
        stats={stats}
        syncMessage={syncMessage}
        searchQuery={searchQuery}
        pendingPrefix={sPrefix ? "s" : gPrefix ? "g" : zPrefix ? "z" : undefined}
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
  jiraBaseUrl?: string;
}

export function renderPlayTUI(options: RenderPlayTUIOptions): void {
  const { filePath, client, projectKey, filter, jiraBaseUrl } = options;

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
      filter={filter}
      jiraBaseUrl={jiraBaseUrl}
    />,
    { exitOnCtrlC: true },
  );

  instance.waitUntilExit().catch(() => {});
}
