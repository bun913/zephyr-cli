import { describe, expect, it } from "vitest";

describe("Example Test Suite", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should verify that environment is set up correctly", () => {
    expect(process.env).toBeDefined();
  });
});
