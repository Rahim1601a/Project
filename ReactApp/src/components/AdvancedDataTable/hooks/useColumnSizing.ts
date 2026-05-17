import { useCallback, useEffect, useRef } from 'react';
import type { Table } from '@tanstack/react-table';
import { calculateGrowColumnSizes } from '../utils/sizing.utils';

export function useColumnSizing<T extends object>(
  table: Table<T>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  layoutMode: 'grid' | 'grid-no-grow' | 'semantic',
  dispatch: (action: any) => void,
) {
  const isManualResized = useRef(false);
  const lastCalculatedWidth = useRef(0);

  const tableRef = useRef(table);
  tableRef.current = table;

  const recalculateSizes = useCallback(() => {
    if (!containerRef.current || layoutMode === 'semantic') return;
    
    const containerWidth = containerRef.current.clientWidth;
    if (containerWidth === lastCalculatedWidth.current && !isManualResized.current) return;
    
    const newSizing = calculateGrowColumnSizes(tableRef.current, containerWidth, layoutMode);
    if (newSizing) {
      lastCalculatedWidth.current = containerWidth;
      const currentSizing = tableRef.current.getState().columnSizing;
      const changed = Object.keys(newSizing).some((key) => newSizing[key] !== currentSizing[key]);
      if (changed) {
        dispatch({ type: 'SET_COLUMN_SIZING', payload: newSizing });
      }
    }
  }, [containerRef, layoutMode, dispatch]);

  // Initial calculation and Resize observer
  useEffect(() => {
    if (layoutMode === 'semantic' || !containerRef.current) return;
    
    let resizeTimeout: any = null;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (Math.abs(width - lastCalculatedWidth.current) > 2) {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          recalculateSizes();
        }, 50);
      }
    });

    observer.observe(containerRef.current);
    recalculateSizes(); // Initial run

    return () => {
      observer.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [recalculateSizes, containerRef, layoutMode]);

  return {
    recalculateSizes,
    setColumnSizing: (updater: any) => {
      isManualResized.current = true;
      const currentSizing = table.getState().columnSizing;
      const newSizing = typeof updater === 'function' ? updater(currentSizing) : updater;
      dispatch({ type: 'SET_COLUMN_SIZING', payload: newSizing });
    },
  };
}
