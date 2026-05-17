import { useVirtualizer } from '@tanstack/react-virtual';
import type { Column } from '@tanstack/react-table';
import { useEffect, useRef } from 'react';

export function useVirtualColumns<T extends object>(
  containerRef: React.RefObject<HTMLDivElement | null>,
  visibleColumns: Column<T, any>[],
  columnSizing?: any,
) {
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: visibleColumns.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => visibleColumns[index].getSize(),
    overscan: 5,
    paddingStart: 0,
    paddingEnd: 0,
  });

  const columnIds = visibleColumns.map((c) => c.id).join(',');
  const columnSizingStr = JSON.stringify(columnSizing || {});

  const lastSizingRef = useRef(columnSizingStr);
  const lastIdsRef = useRef(columnIds);

  if (lastSizingRef.current !== columnSizingStr || lastIdsRef.current !== columnIds) {
    lastSizingRef.current = columnSizingStr;
    lastIdsRef.current = columnIds;
    // Clear measurements cache synchronously during render to prevent 1-frame resize lag
    columnVirtualizer.measurementsCache = [];
  }

  useEffect(() => {
    columnVirtualizer.measure();
  }, [columnSizingStr, columnIds, columnVirtualizer]);

  return columnVirtualizer;
}
