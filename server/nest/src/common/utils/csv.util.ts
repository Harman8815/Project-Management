export function convertToCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) {
        return "";
      }
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export function convertObjectToCSV(obj: Record<string, any>): string {
  return convertToCSV([obj]);
}

export function formatDateForCSV(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}