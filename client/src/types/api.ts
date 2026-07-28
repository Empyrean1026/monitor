export type ApiResponse<T> = { success: true; data: T; message: string };

export type ApiErrorResponse = { success: false; message: string; errors: unknown[] };

/** Standard shape for paginated API resources. */
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
