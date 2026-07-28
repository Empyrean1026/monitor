import dayjs from 'dayjs';

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: '支払い待ち', PAID: '支払済み', PROCESSING: '処理中', SHIPPED: '発送済み',
  COMPLETED: '完了', CANCELLED: 'キャンセル', REFUNDED: '返金済み',
};

const paymentLabels: Record<string, string> = {
  CREDIT_CARD: 'クレジットカード', BANK_TRANSFER: '銀行振込', CASH_ON_DELIVERY: '代金引換',
  PAYPAY: 'PayPay', KONBINI: 'コンビニ払い',
};

export function orderStatusLabel(status: string): string { return statusLabels[status] ?? status; }
export function paymentMethodLabel(method: string): string { return paymentLabels[method] ?? method; }
export function formatOrderMoney(value: number): string { return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value); }
export function formatOrderDate(value: string): string { return dayjs(value).format('YYYY/MM/DD HH:mm'); }
export function statusTagType(status: string): 'success' | 'warning' | 'info' | 'danger' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED' || status === 'REFUNDED') return 'danger';
  if (status === 'PENDING_PAYMENT') return 'warning';
  return 'info';
}
