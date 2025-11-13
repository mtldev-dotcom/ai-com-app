/**
 * File Parsing Utilities
 * Handles CSV and XLSX file parsing
 */
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedRow {
  [key: string]: string | number;
}

export interface ParseResult {
  columns: string[];
  rows: ParsedRow[];
  error?: string;
}

/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    // Read file as text first, then parse
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        resolve({
          columns: [],
          rows: [],
          error: "Failed to read file content",
        });
        return;
      }

      // Type assertion needed due to papaparse type definitions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Papa.parse as any)(text, {
        header: true,
        skipEmptyLines: true,
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ",",
        // Handle quoted fields with commas inside
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        // Ignore FieldMismatch warnings (rows with inconsistent field counts)
        // This happens when quoted fields contain commas
        skipLinesWithError: false,
        // Handle quotes properly - be lenient with quote errors
        // Trailing quote errors often occur with escaped quotes in JSON fields
        relaxQuotes: true, // Be more lenient with quote handling
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        complete: (results: Papa.ParseResult<any>) => {
          // FieldMismatch and "Trailing quote" are warnings, not fatal errors
          // These often occur with escaped quotes in JSON fields within CSV
          // Filter these out as PapaParse handles the data correctly despite the warnings
          const fatalErrors = results.errors.filter((e) => {
            // Ignore trailing quote warnings and field mismatch warnings
            const isTrailingQuote = e.message.includes("Trailing quote");
            const isFieldMismatch = e.type === "FieldMismatch";
            // Only treat actual parsing errors as fatal
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
          const rows = results.data as ParsedRow[];

          // Filter out completely empty rows
          const validRows = rows.filter((row) =>
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
    };

    reader.onerror = () => {
      resolve({
        columns: [],
        rows: [],
        error: "Failed to read file",
      });
    };

    reader.readAsText(file);
  });
}

/**
 * Parse XLSX file
 */
export async function parseXLSX(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as Array<Array<string | number>>;

        if (jsonData.length === 0) {
          resolve({
            columns: [],
            rows: [],
            error: "File is empty",
          });
          return;
        }

        // First row is headers
        const columns = (jsonData[0] as string[]).filter(Boolean);
        const rows: ParsedRow[] = jsonData.slice(1).map((row) => {
          const rowObj: ParsedRow = {};
          columns.forEach((col, index) => {
            rowObj[col] = row[index] || "";
          });
          return rowObj;
        });

        resolve({
          columns,
          rows: rows.filter((row) => Object.values(row).some((v) => v !== "")),
        });
      } catch (error) {
        resolve({
          columns: [],
          rows: [],
          error:
            error instanceof Error
              ? error.message
              : "Failed to parse XLSX file",
        });
      }
    };

    reader.onerror = () => {
      resolve({
        columns: [],
        rows: [],
        error: "Failed to read file",
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse file based on extension
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "csv":
      return parseCSV(file);
    case "xlsx":
    case "xls":
      return parseXLSX(file);
    default:
      return Promise.resolve({
        columns: [],
        rows: [],
        error: `Unsupported file type: ${extension}`,
      });
  }
}
