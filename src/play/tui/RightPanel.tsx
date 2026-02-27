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

/** Replace <br>, <br/>, <br /> tags with newlines */
function br2nl(text: string): string {
  return text.replace(/<br\s*\/?>/gi, "\n");
}

function ExtraFields({ customFields }: { customFields?: Record<string, unknown> }) {
  if (!customFields) return null;
  const entries = Object.entries(customFields).filter(
    ([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
  if (entries.length === 0) return null;
  return (
    <>
      {entries.map(([key, value]) => (
        <Text key={key} dimColor>
          {key}: {String(value)}
        </Text>
      ))}
    </>
  );
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
      {testCase.objective && (
        <Text wrap="wrap" dimColor>
          Objective: {br2nl(testCase.objective)}
        </Text>
      )}
      {testCase.precondition && (
        <Text wrap="wrap" dimColor>
          Precondition: {br2nl(testCase.precondition)}
        </Text>
      )}
      {testCase.labels?.length > 0 && <Text dimColor>Labels: {testCase.labels.join(", ")}</Text>}
      {testCase.component && <Text dimColor>Component: {testCase.component}</Text>}
      {testCase.estimatedTime != null && (
        <Text dimColor>Estimated: {testCase.estimatedTime}ms</Text>
      )}
      {testCase.execution.comment && (
        <Text wrap="wrap" dimColor>
          Comment: {br2nl(testCase.execution.comment)}
        </Text>
      )}
      <ExtraFields customFields={testCase.customFields} />
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
                  wrap="wrap"
                  backgroundColor={isSelected && isFocused ? "blue" : undefined}
                  color={isSelected && isFocused ? "white" : undefined}
                >
                  {marker} {actualStepIdx + 1}. {br2nl(step.description)}
                  {"  "}
                  <Text color={isSelected && isFocused ? "white" : statusColor(stepStatus)}>
                    {statusLabel(stepStatus)}
                  </Text>
                </Text>
                {isSelected && step.expectedResult && (
                  <Text wrap="wrap" dimColor>
                    {" "}
                    Expected: {br2nl(step.expectedResult)}
                  </Text>
                )}
                {isSelected && step.result.actualResult && (
                  <Text wrap="wrap" dimColor>
                    {" "}
                    Actual: {br2nl(step.result.actualResult)}
                  </Text>
                )}
                {isSelected && step.testData && (
                  <Text wrap="wrap" dimColor>
                    {" "}
                    TestData: {br2nl(step.testData)}
                  </Text>
                )}
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
}
