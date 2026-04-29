import { useState, useMemo, useEffect } from 'react';
import { 
  MaterialReactTable, 
  useMaterialReactTable, 
  type MRT_ColumnDef, 
  type MRT_PaginationState 
} from 'material-react-table';
import { useGenericCursorQuery } from '../hooks/useGenericQuery';
import type { QueryKey } from '@tanstack/react-query';

interface GenericTableProps<T extends Record<string, any>> {
  queryKey: QueryKey;
  url: string;
  columns: MRT_ColumnDef<T>[];
  pageSize?: number;
}

export function GenericTable<T extends Record<string, any>>({
  queryKey,
  url,
  columns,
  pageSize = 3,
}: GenericTableProps<T>) {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const [cursors, setCursors] = useState<Record<number, number | null>>({ 0: null });
  const currentCursor = cursors[pagination.pageIndex] ?? null;

  const { data, isLoading, error } = useGenericCursorQuery<T>(
    queryKey,
    url,
    currentCursor,
    pagination.pageSize
  );

  // Reset cursors if page size changes
  useEffect(() => {
    setCursors({ 0: null });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [pagination.pageSize]);

  // Store next cursor for the next page
  useEffect(() => {
    if (data?.nextCursor !== undefined && data?.nextCursor !== null) {
      setCursors((prev) => ({
        ...prev,
        [pagination.pageIndex + 1]: data.nextCursor,
      }));
    }
  }, [data, pagination.pageIndex]);

  // Trick MRT into enabling/disabling the Next button correctly
  const rowCount = useMemo(() => {
    if (!data) return 0;
    const currentCount = (pagination.pageIndex + 1) * pagination.pageSize;
    return data.hasMore ? currentCount + 1 : currentCount;
  }, [data, pagination.pageIndex, pagination.pageSize]);

  const table = useMaterialReactTable({
    columns,
    data: data?.items || [],
    manualPagination: true,
    rowCount,
    state: {
      pagination,
      isLoading,
      showAlertBanner: !!error,
    },
    onPaginationChange: setPagination,
    muiToolbarAlertBannerProps: error
      ? {
          color: 'error',
          children: `Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      : undefined,
  });

  return <MaterialReactTable table={table} />;
}
