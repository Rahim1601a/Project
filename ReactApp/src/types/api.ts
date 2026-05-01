export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message: string;
  statusCode: number;
};

export type CursorPagedResponse<T> = {
  items: T[];
  nextCursor: number | null;
  hasMore: boolean;
};
