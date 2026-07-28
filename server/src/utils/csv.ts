export function csvCell(value: unknown): string { const text = value == null ? '' : String(value); const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; return `"${safe.replaceAll('"', '""')}"`; }
export function createCsv(headers: string[], rows: unknown[][]): string { return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`; }
