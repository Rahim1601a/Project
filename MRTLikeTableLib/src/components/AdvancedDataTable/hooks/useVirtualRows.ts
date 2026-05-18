import { useVirtualizer } from '@tanstack/react-virtual';
import type { ADTDensity } from '../types/types';
import { DENSITY_CONFIG } from '../utils/density.utils';
import React, { useCallback, useLayoutEffect, useMemo } from 'react';

export function useVirtualRows(
  containerRef: React.RefObject<HTMLDivElement | null>,
  rowCount: number,
  density: ADTDensity,
  columnSizing?: Record<string, number>
) {
  const rowHeight = DENSITY_CONFIG[density].rowHeight;
  const estimateSize = useCallback(() => rowHeight, [rowHeight]);
  const columnSizingKey = useMemo(() => JSON.stringify(columnSizing || {}), [columnSizing]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan: 10,
    measureElement: (el) => {
      const height = el.getBoundingClientRect().height;
      return height > 0 ? height : rowHeight;
    },
  });

  useLayoutEffect(() => {
    rowVirtualizer.measure();
  }, [density, rowCount, rowVirtualizer, columnSizingKey]);

  return rowVirtualizer;
}
