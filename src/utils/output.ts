/**
 * Output formatting utilities
 */

import { logger } from "./logger";

/**
 * Column definition for table formatting
 */
export interface TableColumn<T> {
  /** Column header text */
  header: string;
  /** Function to extract value from data item */
  getValue: (item: T) => string | number | null | undefined;
  /** Optional fixed width for the column */
  width?: number;
}

/**
 * Format data as a text table
 *
 * @param data - Array of data items
 * @param columns - Column definitions
 * @returns Formatted table string
 */
export function formatAsTable<T>(data: T[], columns: TableColumn<T>[]): string {
  if (data.length === 0) {
    return "No results found";
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    if (col.width) return col.width;

    // Get max width from header and data
    const headerWidth = col.header.length;
    const dataWidth = Math.max(...data.map((item) => String(col.getValue(item) || "").length));
    return Math.max(headerWidth, dataWidth);
  });

  // Build header
  const headerRow = columns.map((col, idx) => col.header.padEnd(widths[idx] ?? 0)).join("  ");
  const separator = "-".repeat(headerRow.length);

  // Build data rows
  const dataRows = data.map((item) =>
    columns
      .map((col, idx) => {
        const value = col.getValue(item);
        const strValue = value !== null && value !== undefined ? String(value) : "N/A";
        return strValue.padEnd(widths[idx] ?? 0);
      })
      .join("  "),
  );

  return [headerRow, separator, ...dataRows].join("\n");
}

/**
 * Format a single item as key-value pairs
 *
 * @param data - Object to format
 * @param fields - Array of field configurations
 * @returns Formatted string
 */
export function formatAsKeyValue<T>(
  data: T,
  fields: Array<{
    label: string;
    getValue: (item: T) => string | number | null | undefined;
  }>,
): string {
  const maxLabelWidth = Math.max(...fields.map((f) => f.label.length));

  const lines = fields
    .map((field) => {
      const value = field.getValue(data);
      const strValue = value !== null && value !== undefined ? String(value) : "N/A";
      return `${field.label.padEnd(maxLabelWidth)}  ${strValue}`;
    })
    .filter((line) => line.trim().length > 0);

  return lines.join("\n");
}

/**
 * Output results based on JSON flag
 *
 * @param data - Data to output (can be array or single object)
 * @param useJson - Whether to use JSON format
 * @param textFormatter - Function to format data as text (only used when useJson is false)
 */
export function outputResults<T>(
  data: T[] | T,
  useJson: boolean,
  textFormatter: (data: T[] | T) => string,
): void {
  if (useJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(textFormatter(data));
  }
}

/**
 * Show pagination info if more results are available
 *
 * @param hasNext - Whether there are more results available
 * @param startAt - Current starting position
 * @param maxResults - Current max results setting
 */
export function showPaginationInfo(hasNext: boolean, startAt: number, maxResults: number): void {
  if (hasNext) {
    logger.info(`More results available. Use --start-at ${startAt + maxResults} to get next page`);
  }
}
