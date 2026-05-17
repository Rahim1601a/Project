import { useVirtualizer } from '@tanstack/react-virtual';
import type { ADTDensity } from '../types/types';
import { DENSITY_CONFIG } from '../utils/density.utils';
import { useCallback, useEffect } from 'react';

export function useVirtualRows(containerRef: React.RefObject<HTMLDivElement | null>, rowCount: number, density: ADTDensity) {
  const rowHeight = DENSITY_CONFIG[density].rowHeight;
  const estimateSize = useCallback(() => rowHeight, [rowHeight]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan: 10,
    measureElement: (el) => {
      // Return the height of the element, including the detail panel if expanded
      const height = el.getBoundingClientRect().height;
      return height > 0 ? height : rowHeight;
    },
  });

  // Re-measure when density changes or rows update
  useEffect(() => {
    rowVirtualizer.measure();
  }, [density, rowCount, rowVirtualizer]);

  return rowVirtualizer;
}
