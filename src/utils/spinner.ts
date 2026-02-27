const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface Spinner {
  update(message: string): void;
  stop(finalMessage?: string): void;
}

export function createSpinner(initialMessage: string): Spinner {
  let frameIndex = 0;
  let currentMessage = initialMessage;

  const write = () => {
    const frame = FRAMES[frameIndex % FRAMES.length] ?? FRAMES[0];
    process.stderr.write(`\r\x1b[K${frame} ${currentMessage}`);
    frameIndex++;
  };

  write();
  const timer = setInterval(write, 80);

  return {
    update(message: string) {
      currentMessage = message;
    },
    stop(finalMessage?: string) {
      clearInterval(timer);
      process.stderr.write("\r\x1b[K");
      if (finalMessage) {
        process.stderr.write(`${finalMessage}\n`);
      }
    },
  };
}
