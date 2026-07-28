export interface AnalyticsCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

/**
 * Development default. A Redis-backed implementation can replace this without
 * changing analytics service signatures.
 */
export const analyticsCache: AnalyticsCache = {
  async get<T>(): Promise<T | undefined> {
    return undefined;
  },
  async set<T>(_key: string, value: T, _ttlSeconds: number): Promise<void> {
    void value;
    void _ttlSeconds;
    return undefined;
  },
};
