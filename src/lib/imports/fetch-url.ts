/**
 * URL Fetching Utilities
 * Fetches and parses files from URLs
 */
import { parseCSV, parseXLSX, type ParseResult } from "./parse-file";

/**
 * Convert Google Sheets edit URL to CSV export URL
 * Example: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit?gid=GID
 * Returns: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=GID
 */
function convertGoogleSheetsUrl(url: string): string {
  // Check if it's a Google Sheets URL
  const googleSheetsMatch = url.match(
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );

  if (googleSheetsMatch) {
    const spreadsheetId = googleSheetsMatch[1];
    // Extract GID from URL (can be in query params or hash)
    const gidMatch = url.match(/[#&]gid=(\d+)/) || url.match(/gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";

    // Return CSV export URL
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  }

  return url;
}

/**
 * Fetch file from URL and parse it
 */
export async function fetchAndParseUrl(
  url: string
): Promise<ParseResult & { filename: string }> {
  try {
    // Convert Google Sheets URLs to CSV export format
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

    // Determine file type
    let fileType: "csv" | "xlsx" = "csv";
    if (
      contentType.includes("spreadsheet") ||
      contentType.includes("excel") ||
      urlExtension === "xlsx" ||
      urlExtension === "xls"
    ) {
      fileType = "xlsx";
    }

    // Get file content
    if (fileType === "csv") {
      const text = await response.text();
      // Create a File-like object for parsing
      const blob = new Blob([text], { type: "text/csv" });
      const file = new File([blob], url.split("/").pop() || "file.csv", {
        type: "text/csv",
      });

      const result = await parseCSV(file);
      return {
        ...result,
        filename: url.split("/").pop() || url,
      };
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const file = new File([blob], url.split("/").pop() || "file.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const result = await parseXLSX(file);
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
