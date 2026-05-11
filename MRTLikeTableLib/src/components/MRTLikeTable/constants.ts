import type { ColumnSizingState } from '@tanstack/react-table';

/* =========================================================
   Layout Constants
   Centralizes all magic numbers for maintainability
 ========================================================= */

/** Fixed column widths for system columns (px) */
export const FIXED_COLUMN_WIDTHS: Record<string, number> = {
  __select__: 50,
  __expand__: 50,
  __row_numbers__: 50,
  __actions__: 110,
} as const;

/** System column IDs that should not be user-configurable */
export const SYSTEM_COLUMN_IDS = Object.keys(FIXED_COLUMN_WIDTHS);

/** Default column sizing constraints */
export const COLUMN_DEFAULTS = {
  minSize: 80,
  size: 120,
  maxSize: 280,
  responsiveMin: 75,
  responsiveMax: 250,
} as const;

/** Row heights by density (px) */
export const ROW_HEIGHTS: Record<string, number> = {
  small: 37,
  medium: 53,
  large: 69,
} as const;

/** Cell padding by density */
export const CELL_PADDING: Record<string, { action: string; data: string }> = {
  small: { action: '0', data: '4px 12px' },
  medium: { action: '0', data: '8px 16px' },
  large: { action: '0', data: '12px 20px' },
} as const;

/** Virtualizer overscan rows */
export const VIRTUALIZER_OVERSCAN = 10;

/** Scrollbar and padding buffer for responsive sizing */
export const SCROLL_BUFFER = 25;

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;

/** Default pinning config */
export const DEFAULT_PINNING = { left: ['__select__', '__actions__'], right: [] as string[] } as const;

/** Empty column sizing state */
export const EMPTY_SIZING: ColumnSizingState = {};
