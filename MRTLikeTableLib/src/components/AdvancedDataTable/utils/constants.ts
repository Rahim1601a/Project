export const ROW_HEIGHTS = {
  compact: 32,
  comfortable: 48,
  spacious: 64,
};

export const HEADER_HEIGHTS = {
  compact: 40,
  comfortable: 56,
  spacious: 72,
};

export const CELL_PADDING_X = {
  compact: '8px',
  comfortable: '12px',
  spacious: '16px',
};

export const CELL_PADDING_Y = {
  compact: '4px',
  comfortable: '8px',
  spacious: '12px',
};

export const FONT_SIZES = {
  compact: '0.8125rem',
  comfortable: '0.875rem',
  spacious: '1rem',
};

export const COLUMN_DEFAULTS = {
  minSize: 60,
  size: 150,
  maxSize: 800,
  responsiveMin: 100,
  responsiveMax: 400,
};

export const FIXED_COLUMN_WIDTHS: Record<string, number> = {
  __row_numbers__: 60,
  __select__: 50,
  __expand__: 50,
  __actions__: 100,
};

export const VIRTUALIZER_OVERSCAN = 5;
export const SCROLL_BUFFER = 16;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
