/**
 * Server-side URL Fetching Utilities
 * Fetches and parses files from URLs (server-side compatible)
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParseResult } from "./parse-file";

/**
 * Convert Google Sheets edit URL to CSV export URL
 */
function convertGoogleSheetsUrl(url: string): string {
  const googleSheetsMatch = url.match(
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );

  if (googleSheetsMatch) {
    const spreadsheetId = googleSheetsMatch[1];
    const gidMatch = url.match(/[#&]gid=(\d+)/) || url.match(/gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  }

  return url;
}

/**
 * Parse CSV text directly (server-side)
 */
function parseCSVText(text: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Papa.parse as any)(text, {
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ",",
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      skipLinesWithError: false,
      relaxQuotes: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      complete: (results: Papa.ParseResult<any>) => {
        const fatalErrors = results.errors.filter((e) => {
          const isTrailingQuote = e.message.includes("Trailing quote");
          const isFieldMismatch = e.type === "FieldMismatch";
          return !isTrailingQuote && !isFieldMismatch;
        });

        if (fatalErrors.length > 0) {
          resolve({
            columns: [],
            rows: [],
            error: fatalErrors
              .map((e) => `${e.message} (row ${e.row})`)
              .join(", "),
          });
          return;
        }

        const columns = results.meta.fields || [];
        const rows = results.data;

        const validRows = rows.filter((row: Record<string, unknown>) =>
          Object.values(row).some(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          )
        );

        resolve({
          columns,
          rows: validRows,
        });
      },
      error: (error: Papa.ParseError) => {
        resolve({
          columns: [],
          rows: [],
          error: error.message,
        });
      },
    });
  });
}

/**
 * Parse XLSX buffer directly (server-side)
 */
function parseXLSXBuffer(buffer: ArrayBuffer): ParseResult {
  try {
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: "array" });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as Array<Array<string | number>>;

    if (jsonData.length === 0) {
      return {
        columns: [],
        rows: [],
        error: "File is empty",
      };
    }

    const columns = (jsonData[0] as string[]).filter(Boolean);
    const rows = jsonData.slice(1).map((row) => {
      const rowObj: Record<string, string | number> = {};
      columns.forEach((col, index) => {
        rowObj[col] = row[index] || "";
      });
      return rowObj;
    });

    return {
      columns,
      rows: rows.filter((row) => Object.values(row).some((v) => v !== "")),
    };
  } catch (error) {
    return {
      columns: [],
      rows: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse XLSX file",
    };
  }
}

/**
 * Fetch file from URL and parse it (server-side compatible)
 */
export async function fetchAndParseUrlServer(
  url: string
): Promise<ParseResult & { filename: string }> {
  try {
    const exportUrl = convertGoogleSheetsUrl(url);

    const response = await fetch(exportUrl);

    if (!response.ok) {
      return {
        columns: [],
        rows: [],
        filename: url,
        error: `Failed to fetch: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const urlExtension = url.split(".").pop()?.toLowerCase() || "";

    let fileType: "csv" | "xlsx" = "csv";
    if (
      contentType.includes("spreadsheet") ||
      contentType.includes("excel") ||
      urlExtension === "xlsx" ||
      urlExtension === "xls"
    ) {
      fileType = "xlsx";
    }

    if (fileType === "csv") {
      const text = await response.text();
      const result = await parseCSVText(text);
      return {
        ...result,
        filename: url.split("/").pop() || url,
      };
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const result = parseXLSXBuffer(arrayBuffer);
      return {
        ...result,
        filename: url.split("/").pop() || url,
      };
    }
  } catch (error) {
    return {
      columns: [],
      rows: [],
      filename: url,
      error: error instanceof Error ? error.message : "Failed to fetch URL",
    };
  }
}

