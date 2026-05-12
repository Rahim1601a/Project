import React, { memo } from 'react';
import { Box, alpha } from '@mui/material';
import { AdvancedDataTableCell } from './AdvancedDataTableCell';
import { ROW_HEIGHTS } from '../utils/constants';

/* =========================================================
   Row Props
========================================================= */

interface AdvancedDataTableRowProps {
  row: any;
  density: string;
  isSelected: boolean;
  isExpanded: boolean;
  enableClickToCopy?: boolean;
  editingRowId?: string | null;
  editValues?: Record<string, any>;
  onEditChange?: (columnId: string, value: any) => void;
  style?: React.CSSProperties;
  columnSizing?: Record<string, number>;
  renderDetailPanel?: (props: { row: any }) => React.ReactNode;
  virtualIndex: number;
  rowSelection?: Record<string, boolean>;
}

/* =========================================================
   Custom Equality — only re-renders when row-relevant data changes.
   Prevents cascading re-renders from unrelated state changes
   (e.g., export menu open, visibility menu, global filter typing).
 ========================================================= */

function rowAreEqual(prev: AdvancedDataTableRowProps, next: AdvancedDataTableRowProps): boolean {
  return (
    prev.row.original === next.row.original &&
    prev.density === next.density &&
    prev.isSelected === next.isSelected &&
    prev.isExpanded === next.isExpanded &&
    prev.editingRowId === next.editingRowId &&
    (prev.editingRowId === prev.row.id ? prev.editValues === next.editValues : true) &&
    prev.virtualIndex === next.virtualIndex &&
    prev.columnSizing === next.columnSizing
  );
}

/* =========================================================
   Memoized Table Row
 ========================================================= */

export const AdvancedDataTableRow = memo(
  React.forwardRef<HTMLDivElement, AdvancedDataTableRowProps>(function AdvancedDataTableRow(
    { row, density, isSelected, isExpanded, enableClickToCopy, editingRowId, editValues, style, columnSizing, renderDetailPanel, virtualIndex },
    ref,
  ) {
    const isEditing = editingRowId === row.id;

    return (
      <Box
        ref={ref}
        data-index={virtualIndex}
        role='row'
        style={style}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minWidth: 'max-content',

          height: isExpanded ? 'auto' : ROW_HEIGHTS[density],
          minHeight: ROW_HEIGHTS[density],
          maxHeight: isExpanded ? 'none' : ROW_HEIGHTS[density],

          boxSizing: 'border-box',
          bgcolor: isEditing ? alpha('#000', 0.03) : row.getIsGrouped() ? alpha('#000', 0.02) : 'transparent',
        }}
      >
        <Box sx={{ display: 'flex', width: '100%' }}>
          {row.getVisibleCells().map((cell: any) => (
            <AdvancedDataTableCell
              key={cell.id}
              cell={cell}
              density={density}
              enableClickToCopy={enableClickToCopy}
              isEditing={isEditing}
              isSelected={isSelected}
              isExpanded={isExpanded}
              editValue={isEditing ? editValues?.[cell.column.id] : undefined}
              columnSizing={columnSizing}
            />
          ))}
        </Box>

        {/* Detail Panel */}
        {renderDetailPanel && isExpanded && (
          <Box sx={{ width: '100%', p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#000', 0.01) }}>
            {renderDetailPanel({ row: row.original })}
          </Box>
        )}
      </Box>
    );
  }),
  rowAreEqual,
);
