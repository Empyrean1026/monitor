export type RealtimeMessageType = 'CONNECTION_ESTABLISHED' | 'ORDER_CREATED' | 'METRICS_UPDATED' | 'ONLINE_COUNT_UPDATED' | 'PING' | 'PONG' | 'ERROR';
export type RealtimeMessage<T = unknown> = { type: RealtimeMessageType; timestamp: string; data: T };
export type RealtimeOrder = { orderNumber: string; customerName: string; region: string; totalAmount: number; createdAt: string; status: string };
export type RealtimeMetrics = { totalRevenue: number; totalOrders: number };
