import type React from 'react';
import type { ADTDensity } from '../types/types';

export const DENSITY_CONFIG: Record<
  ADTDensity,
  {
    rowHeight: number;
    paddingY: string;
    paddingX: string;
    fontSize: string;
    iconSize: string;
    checkboxSize: 'small' | 'medium';
  }
> = {
  compact: {
    rowHeight: 32,
    paddingY: '4px',
    paddingX: '8px',
    fontSize: '0.75rem',
    iconSize: '1.1rem',
    checkboxSize: 'small',
  },
  comfortable: {
    rowHeight: 48,
    paddingY: '8px',
    paddingX: '12px',
    fontSize: '0.875rem',
    iconSize: '1.25rem',
    checkboxSize: 'medium',
  },
  spacious: {
    rowHeight: 64,
    paddingY: '12px',
    paddingX: '16px',
    fontSize: '1rem',
    iconSize: '1.5rem',
    checkboxSize: 'medium',
  },
};

export function getDensityCssVariables(density: ADTDensity) {
  const config = DENSITY_CONFIG[density];
  return {
    '--adt-row-height': `${config.rowHeight}px`,
    '--adt-cell-padding-y': config.paddingY,
    '--adt-cell-padding-x': config.paddingX,
    '--adt-font-size': config.fontSize,
    '--adt-icon-size': config.iconSize,
  } as React.CSSProperties;
}
