import { http } from './http';

export type ExportKind = 'sales' | 'products' | 'customers' | 'orders';
export async function downloadCsv(kind: ExportKind, params: Record<string, string | number | undefined>): Promise<void> { const response = await http.get(`/exports/${kind}`, { params, responseType: 'blob' }); const fallback = `${kind}-report.csv`; const disposition = String(response.headers['content-disposition'] ?? ''); const match = disposition.match(/filename="?([^";]+)"?/); const url = URL.createObjectURL(response.data as Blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = match?.[1] ?? fallback; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); }
