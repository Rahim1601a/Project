import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Row, Table } from '@tanstack/react-table';
import { Box, Collapse } from '@mui/material';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { ADTRowWrapper } from './AdvancedDataTable.styles';
import { AdvancedDataTableCell } from './AdvancedDataTableCell';
import type { ADTMeta } from '../types/types';

interface Props<T extends object> {
  row: Row<T>;
  table: Table<T>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>;
  columnSizing: Record<string, number>;
  renderDetailPanel?: (props: { row: Row<T>; table: Table<T> }) => React.ReactNode;
  style: React.CSSProperties;
}

function AdvancedDataTableRowInner<T extends object>({
  row,
  table,
  virtualRow,
  rowVirtualizer,
  columnVirtualizer,
  columnSizing,
  renderDetailPanel,
  style,
}: Props<T>) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isSelected = row.getIsSelected();
  const isExpanded = row.getIsExpanded();
  const isGroupedRow = row.getIsGrouped();

  const meta = table.options.meta as ADTMeta<T>;
  const isEditing = meta?.editingRowId === row.id;

  const columnSizingKey = useMemo(() => JSON.stringify(columnSizing || {}), [columnSizing]);

  const allCells = row.getVisibleCells();

  const leftPinnedCells = allCells.filter((cell) => cell.column.getIsPinned() === 'left');
  const rightPinnedCells = allCells.filter((cell) => cell.column.getIsPinned() === 'right');
  const unpinnedCells = allCells.filter((cell) => !cell.column.getIsPinned());

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalUnpinnedWidth = columnVirtualizer.getTotalSize();

  const beforeWidth = virtualColumns[0]?.start ?? 0;
  const afterWidth = Math.max(0, totalUnpinnedWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0));

  const totalWidth =
    leftPinnedCells.reduce((acc, c) => acc + c.column.getSize(), 0) +
    totalUnpinnedWidth +
    rightPinnedCells.reduce((acc, c) => acc + c.column.getSize(), 0);

  const shouldRenderDetailPanel = Boolean(renderDetailPanel && !isGroupedRow);

  const rowVirtualizerRef = useRef(rowVirtualizer);
  useEffect(() => {
    rowVirtualizerRef.current = rowVirtualizer;
  }, [rowVirtualizer]);

  const measureRow = useCallback(() => {
    if (!rowRef.current) return;

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      if (rowRef.current) {
        rowVirtualizerRef.current.measureElement(rowRef.current);
      }
    });
  }, []);

  const measureDuringAnimation = useCallback(() => {
    const duration = 350;
    const startTime = performance.now();

    const tick = () => {
      if (rowRef.current) {
        rowVirtualizerRef.current.measureElement(rowRef.current);
      }

      if (performance.now() - startTime < duration) {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  }, []);

  const lastHeightRef = useRef<number>(0);
  const setMeasuredRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (rowRef.current === node) {
        return;
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      rowRef.current = node;

      if (!node) return;

      const initialHeight = node.getBoundingClientRect().height;
      lastHeightRef.current = initialHeight;
      rowVirtualizerRef.current.measureElement(node);

      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const currentHeight = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
          if (Math.abs(currentHeight - lastHeightRef.current) > 0.5) {
            lastHeightRef.current = currentHeight;
            measureRow();
          }
        }
      });

      resizeObserverRef.current.observe(node);
    },
    [measureRow]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const handler = row.getToggleSelectedHandler?.();

        if (handler) {
          handler(event.nativeEvent);
          event.preventDefault();
        }
      }
    },
    [row]
  );

  useEffect(() => {
    measureRow();
  }, [columnSizingKey, measureRow]);

  useEffect(() => {
    measureDuringAnimation();
  }, [isExpanded, measureDuringAnimation]);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <ADTRowWrapper
      role='row'
      aria-rowindex={row.index + 1}
      data-index={virtualRow.index}
      ref={setMeasuredRowRef}
      isSelected={isSelected}
      isEditing={isEditing}
      isGrouped={isGroupedRow}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        ...style,
        width: totalWidth,
        minWidth: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: totalWidth,
          minWidth: '100%',
          minHeight: 'var(--adt-row-height)',
          boxSizing: 'border-box',
          alignItems: 'stretch',
        }}
      >
        {leftPinnedCells.map((cell) => (
          <AdvancedDataTableCell
            key={cell.id}
            cell={cell}
            style={{
              width: cell.column.getSize(),
              minWidth: cell.column.getSize(),
              flex: '0 0 auto',
              left: cell.column.getStart('left'),
            }}
          />
        ))}

        {beforeWidth > 0 && <Box sx={{ width: beforeWidth, flexShrink: 0 }} />}

        {virtualColumns.map((virtualColumn: VirtualItem) => {
          const cell = unpinnedCells[virtualColumn.index];

          if (!cell) return null;

          return (
            <AdvancedDataTableCell
              key={cell.id}
              cell={cell}
              style={{
                width: cell.column.getSize(),
                minWidth: cell.column.getSize(),
                flex: '0 0 auto',
              }}
            />
          );
        })}

        {afterWidth > 0 && <Box sx={{ width: afterWidth, flexShrink: 0 }} />}

        {rightPinnedCells.map((cell) => (
          <AdvancedDataTableCell
            key={cell.id}
            cell={cell}
            style={{
              width: cell.column.getSize(),
              minWidth: cell.column.getSize(),
              flex: '0 0 auto',
              right: cell.column.getAfter('right'),
            }}
          />
        ))}
      </Box>

      {shouldRenderDetailPanel && (
        <Collapse
          in={isExpanded}
          timeout={300}
          unmountOnExit
          onEnter={measureDuringAnimation}
          onEntering={measureDuringAnimation}
          onEntered={measureRow}
          onExit={measureDuringAnimation}
          onExiting={measureDuringAnimation}
          onExited={measureRow}
        >
          <Box
            role='region'
            aria-label={`Expanded details for row ${row.index + 1}`}
            sx={{
              width: totalWidth,
              minWidth: '100%',
              boxSizing: 'border-box',
              px: 4,
              py: 2.5,
              borderTop: '1px solid var(--adt-border-color)',
              borderBottom: '1px solid var(--adt-border-color)',
              backgroundColor: 'background.default',
            }}
          >
            {renderDetailPanel?.({ row, table })}
          </Box>
        </Collapse>
      )}
    </ADTRowWrapper>
  );
}

export const AdvancedDataTableRow = AdvancedDataTableRowInner;
