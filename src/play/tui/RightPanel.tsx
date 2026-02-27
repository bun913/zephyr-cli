import { Box, Text } from "ink";
import type { SnapshotTestCase } from "../../snapshot/types";

interface RightPanelProps {
  testCase: SnapshotTestCase | null;
  stepCursor: number;
  isFocused: boolean;
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

export function RightPanel({ testCase, stepCursor, isFocused, height }: RightPanelProps) {
  if (!testCase) {
    return (
      <Box flexDirection="column" width="60%" borderStyle="single" borderColor="gray">
        <Text dimColor>Select a test case from the left panel</Text>
      </Box>
    );
  }

  const execStatus = testCase.execution.status;
  const headerLines = 5; // key, folder, status, blank, "Steps:"
  const maxStepLines = Math.max(1, height - headerLines - 2);

  // Viewport scrolling for steps
  let stepOffset = 0;
  if (stepCursor >= maxStepLines) {
    stepOffset = stepCursor - maxStepLines + 1;
  }
  const visibleSteps = testCase.steps.slice(stepOffset, stepOffset + maxStepLines);

  return (
    <Box
      flexDirection="column"
      width="60%"
      borderStyle="single"
      borderColor={isFocused ? "cyan" : "gray"}
    >
      <Text bold>
        {testCase.key}: {testCase.name}
      </Text>
      <Text>Folder: {testCase.folderPath || "(none)"}</Text>
      <Text>
        Status: <Text color={statusColor(execStatus)}>{execStatus || "Not Executed"}</Text>
      </Text>
      {testCase.execution.comment && <Text dimColor>Comment: {testCase.execution.comment}</Text>}
      <Text> </Text>

      {testCase.steps.length === 0 ? (
        <Text dimColor>No steps</Text>
      ) : (
        <>
          <Text bold>Steps:</Text>
          {visibleSteps.map((step, vi) => {
            const actualStepIdx = stepOffset + vi;
            const isSelected = actualStepIdx === stepCursor;
            const marker = isSelected && isFocused ? ">" : " ";
            const stepStatus = step.result.status;

            return (
              <Box key={`step-${step.index}`} flexDirection="column">
                <Text
                  backgroundColor={isSelected && isFocused ? "blue" : undefined}
                  color={isSelected && isFocused ? "white" : undefined}
                >
                  {marker} {actualStepIdx + 1}. {step.description}
                  {"  "}
                  <Text color={isSelected && isFocused ? "white" : statusColor(stepStatus)}>
                    {statusLabel(stepStatus)}
                  </Text>
                </Text>
                {isSelected && step.expectedResult && (
                  <Text dimColor> Expected: {step.expectedResult}</Text>
                )}
                {isSelected && step.result.actualResult && (
                  <Text dimColor> Actual: {step.result.actualResult}</Text>
                )}
                {isSelected && step.testData && <Text dimColor> TestData: {step.testData}</Text>}
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
}
