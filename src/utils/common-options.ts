/**
 * Common CLI options shared across multiple commands
 */

import type { Command } from "commander";

/**
 * Pagination options shared by list commands
 */
export interface PaginationOptions {
  maxResults: number;
  startAt: number;
}

/**
 * Custom fields type
 */
export type CustomFields = Record<string, unknown>;

/**
 * Parse a custom field value string into appropriate type
 * - Numbers: "123" -> 123
 * - Booleans: "true"/"false" -> true/false
 * - JSON arrays/objects: "[...]" or "{...}" -> parsed JSON
 * - Strings: everything else
 */
function parseCustomFieldValue(value: string): unknown {
  // Try number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  // Try boolean
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // Try JSON (arrays or objects)
  if (
    (value.startsWith("[") && value.endsWith("]")) ||
    (value.startsWith("{") && value.endsWith("}"))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      // Not valid JSON, treat as string
    }
  }

  // Default to string
  return value;
}

/**
 * Parse custom field option "key=value" into object entry
 */
function parseCustomField(input: string, prev: CustomFields = {}): CustomFields {
  const eqIndex = input.indexOf("=");
  if (eqIndex === -1) {
    throw new Error(`Invalid custom field format: "${input}". Expected "key=value"`);
  }

  const key = input.slice(0, eqIndex).trim();
  const value = input.slice(eqIndex + 1);

  return {
    ...prev,
    [key]: parseCustomFieldValue(value),
  };
}

/**
 * Register pagination options for list commands
 *
 * These options are common across all resource list operations:
 * - maxResults: Maximum number of results to return
 * - startAt: Zero-indexed starting position for pagination
 *
 * @param command - Commander.js command instance
 * @returns The command with pagination options registered
 */
export function registerPaginationOptions(command: Command): Command {
  return command
    .option(
      "--max-results <number>",
      "Maximum results to return (1-1000)",
      (val) => {
        const num = Number.parseInt(val, 10);
        if (Number.isNaN(num) || num < 1 || num > 1000) {
          throw new Error("--max-results must be a number between 1 and 1000");
        }
        return num;
      },
      10,
    )
    .option(
      "--start-at <number>",
      "Starting position (zero-indexed)",
      (val) => {
        const num = Number.parseInt(val, 10);
        if (Number.isNaN(num) || num < 0) {
          throw new Error("--start-at must be a non-negative number");
        }
        return num;
      },
      0,
    );
}

/**
 * Register custom field options for create/update commands
 *
 * @param command - Commander.js command instance
 * @returns The command with custom field option registered
 */
export function registerCustomFieldOptions(command: Command): Command {
  return command.option(
    "--custom-field <key=value>",
    "Set custom field (can be specified multiple times). Values are auto-parsed as number/boolean/JSON array",
    parseCustomField,
  );
}
