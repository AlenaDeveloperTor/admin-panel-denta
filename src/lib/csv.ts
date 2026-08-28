/** Экспорт массива объектов в CSV и скачивание файла */
export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columnMap?: Record<string, string>,
): void {
  if (!rows.length) return;

  const keys = Object.keys(rows[0]);
  const headers = keys.map((k) => columnMap?.[k] ?? k);

  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v);
    if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.join(';'), ...rows.map((r) => keys.map((k) => escape(r[k])).join(';'))];
  const csv = '\uFEFF' + lines.join('\r\n'); // BOM — чтобы Excel открывал UTF-8 корректно

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
