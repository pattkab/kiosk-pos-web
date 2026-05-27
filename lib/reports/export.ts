type ExportValue = string | number | boolean | null | undefined;

export function downloadCsv(filename: string, rows: Record<string, ExportValue>[]) {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const escapeValue = (value: ExportValue) => {
    const text = value == null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [
    columns.map(escapeValue).join(","),
    ...rows.map((row) => columns.map((column) => escapeValue(row[column])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printReport() {
  window.print();
}
