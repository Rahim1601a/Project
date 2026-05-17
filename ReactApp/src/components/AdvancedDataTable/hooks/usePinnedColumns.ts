import { useMemo } from 'react';
import type { Table } from '@tanstack/react-table';

export function usePinnedColumns<T extends object>(table: Table<T>) {
  const leftPinned = useMemo(() => table.getLeftLeafColumns(), [table]);
  const rightPinned = useMemo(() => table.getRightLeafColumns(), [table]);

  const getIsPinned = (columnId: string) => {
    const col = table.getColumn(columnId);
    return col?.getIsPinned() || false;
  };

  const getPinnedOffset = (columnId: string) => {
    const col = table.getColumn(columnId);
    if (!col) return 0;
    const pinned = col.getIsPinned();
    if (pinned === 'left') return col.getStart('left');
    if (pinned === 'right') return col.getAfter('right');
    return 0;
  };

  return {
    leftPinned,
    rightPinned,
    getIsPinned,
    getPinnedOffset,
  };
}
