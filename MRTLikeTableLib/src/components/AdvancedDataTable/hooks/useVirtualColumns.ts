import { useVirtualizer } from '@tanstack/react-virtual';
import type { Column } from '@tanstack/react-table';
import React, { useLayoutEffect, useMemo } from 'react';

export function useVirtualColumns<T extends object>(
  containerRef: React.RefObject<HTMLDivElement | null>,
  visibleColumns: Column<T, any>[],
  columnSizing?: any
) {
  const columnIds = useMemo(() => visibleColumns.map((c) => c.id).join(','), [visibleColumns]);
  const columnSizingStr = useMemo(() => JSON.stringify(columnSizing || {}), [columnSizing]);

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: visibleColumns.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => visibleColumns[index]?.getSize() ?? 0,
    overscan: 5,
    paddingStart: 0,
    paddingEnd: 0,
    getItemKey: (index) => visibleColumns[index]?.id ?? String(index),
  });

  useLayoutEffect(() => {
    if (columnIds.length === 0) {
      return;
    }
    columnVirtualizer.measure();
  }, [columnIds, columnSizingStr, columnVirtualizer]);

  return columnVirtualizer;
}
