import * as XLSX from "xlsx";

export function exportToExcel(rows: Record<string, unknown>[], filename: string, sheetName = "Données") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  // Auto column widths
  const maxWidths: number[] = [];
  rows.forEach(row => {
    Object.values(row).forEach((v, i) => {
      const len = String(v ?? "").length;
      maxWidths[i] = Math.max(maxWidths[i] ?? 10, len + 2);
    });
  });
  ws["!cols"] = maxWidths.map(w => ({ wch: Math.min(w, 50) }));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportMultiSheet(sheets: { name: string; rows: Record<string, unknown>[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const maxWidths: number[] = [];
    rows.forEach(row => {
      Object.values(row).forEach((v, i) => {
        const len = String(v ?? "").length;
        maxWidths[i] = Math.max(maxWidths[i] ?? 10, len + 2);
      });
    });
    ws["!cols"] = maxWidths.map(w => ({ wch: Math.min(w, 50) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
