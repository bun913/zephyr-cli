import { TextInput } from "@inkjs/ui";
import { Box, Text, useInput } from "ink";
import type { InputMode } from "./lib/types";

interface TextInputOverlayProps {
  inputMode: InputMode;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function TextInputOverlay({ inputMode, onSubmit, onCancel }: TextInputOverlayProps) {
  const label =
    inputMode.kind === "stepActualResult"
      ? `Actual result for step ${inputMode.stepIndex + 1} (${inputMode.status}):`
      : `Comment for ${inputMode.status}:`;

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text>{label}</Text>
      <Text dimColor>(Enter to confirm, Esc to cancel)</Text>
      <TextInput onSubmit={(value) => onSubmit(value)} placeholder="Type here..." />
    </Box>
  );
}
