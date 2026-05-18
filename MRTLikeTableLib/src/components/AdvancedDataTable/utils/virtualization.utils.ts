import type React from 'react';

export function getVirtualRowStyles(virtualRow: { start: number; index: number }): React.CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    transform: `translateY(${virtualRow.start}px)`,
  };
}

export function getVirtualColumnStyles(virtualColumn: { start: number; index: number; size: number }): React.CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${virtualColumn.size}px`,
    transform: `translateX(${virtualColumn.start}px)`,
  };
}
