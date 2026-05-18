import { useState, useMemo, useEffect } from 'react';
import { AdvancedDataTable } from './AdvancedDataTable';
import type { ADT_ColumnDef, AdvancedDataTableProps } from './AdvancedDataTable/types/types';
import { useGenericCursorQuery, useGenericQuery } from '../hooks/useGenericQuery';
import type { QueryKey } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';

interface GenericTableProps<T extends object> {
  queryKey: QueryKey;
  url: string;
  columns: ADT_ColumnDef<T>[];
  pageSize?: number;
  /** When true (default), uses server-side cursor pagination.
   *  When false, fetches all data at once and handles pagination client-side. */
  isPagination?: boolean;
  tableOptions?: Partial<AdvancedDataTableProps<T>>;
}

export function GenericTable<T extends object>({ queryKey, url, columns, pageSize = 10, isPagination = true, tableOptions }: GenericTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const [cursors, setCursors] = useState<Record<number, number | null>>({ 0: null });
  const currentCursor = cursors[pagination.pageIndex] ?? null;

  // ── Paginated mode (Server-side cursor) ──────────────────────────────────
  const { data: pagedData, isLoading: isPagedLoading } = useGenericCursorQuery<T>(
    queryKey,
    url,
    currentCursor,
    pagination.pageSize,
    {},
    { enabled: isPagination },
  );

  // ── Non-paginated mode (Fetch all at once) ───────────────────────────────
  const { data: allData, isLoading: isAllLoading } = useGenericQuery<T[]>(queryKey, url, {}, { enabled: !isPagination });

  // Reset cursors and pagination if page size prop changes
  useEffect(() => {
    if (isPagination) {
      setCursors({ 0: null });
      setPagination((prev) => ({
        ...prev,
        pageIndex: 0,
        pageSize,
      }));
    }
  }, [pageSize, isPagination]);

  // Store next cursor for the next page (only for paginated mode)
  useEffect(() => {
    if (isPagination && pagedData?.nextCursor !== undefined && pagedData?.nextCursor !== null) {
      setCursors((prev) => ({
        ...prev,
        [pagination.pageIndex + 1]: pagedData.nextCursor,
      }));
    }
  }, [pagedData, pagination.pageIndex, isPagination]);

  const tableData = useMemo(() => {
    if (isPagination) return pagedData?.items || [];
    return allData || [];
  }, [isPagination, pagedData, allData]);

  const isLoading = isPagination ? isPagedLoading : isAllLoading;

  // Row count for pagination status
  const rowCount = useMemo(() => {
    if (isPagination) {
      if (!pagedData) return 0;
      const currentCount = (pagination.pageIndex + 1) * pagination.pageSize;
      return pagedData.hasMore ? currentCount + 1 : currentCount;
    }
    return allData?.length || 0;
  }, [isPagination, pagedData, allData, pagination.pageIndex, pagination.pageSize]);

  return (
    <AdvancedDataTable
      columns={columns}
      data={tableData}
      loading={isLoading}
      rowCount={rowCount}
      manualPagination={isPagination}
      state={{
        pagination,
        ...tableOptions?.state,
      }}
      onPaginationChange={setPagination}
      {...tableOptions}
    />
  );
}
