import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Table } from '@tanstack/react-table';
import { calculateGrowColumnSizes } from '../utils/sizing.utils';

export function useColumnSizing<T extends object>(
  table: Table<T>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  layoutMode: 'grid' | 'grid-no-grow' | 'semantic',
  dispatch: (action: any) => void
) {
  const isManualResized = useRef(false);
  const lastCalculatedWidth = useRef(0);
  const lastVisibleColumns = useRef('');

  const visibleColumns = table.getVisibleLeafColumns();
  const visibleColumnIds = useMemo(() => visibleColumns.map((column) => column.id).join(','), [visibleColumns]);

  const recalculateSizes = useCallback(() => {
    if (!containerRef.current || layoutMode === 'semantic') return;

    const containerWidth = containerRef.current.clientWidth;
    if (containerWidth <= 0) return;

    const hasColumnsChanged = visibleColumnIds !== lastVisibleColumns.current;
    if (containerWidth === lastCalculatedWidth.current && !hasColumnsChanged && !isManualResized.current) return;

    const newSizing = calculateGrowColumnSizes(table, containerWidth, layoutMode);
    if (newSizing) {
      lastCalculatedWidth.current = containerWidth;
      lastVisibleColumns.current = visibleColumnIds;
      const currentSizing = table.getState().columnSizing;
      const changed = Object.keys(newSizing).some((key) => newSizing[key] !== currentSizing[key]);
      if (changed) {
        dispatch({ type: 'SET_COLUMN_SIZING', payload: newSizing });
      }
    }
  }, [containerRef, layoutMode, dispatch, table, visibleColumnIds]);

  useEffect(() => {
    if (layoutMode === 'semantic' || !containerRef.current) return;

    let frameId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (Math.abs(width - lastCalculatedWidth.current) > 2) {
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(() => {
          recalculateSizes();
        });
      }
    });

    observer.observe(containerRef.current);
    recalculateSizes();

    return () => {
      observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [recalculateSizes, containerRef, layoutMode, visibleColumnIds]);

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
