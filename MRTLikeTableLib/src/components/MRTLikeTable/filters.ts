import type { FilterFn } from '@tanstack/react-table';
import type { MRTLikeColumnDef } from './types';

/* =========================================================
   Helpers
 ========================================================= */

export const normalize = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .trim();

/* =========================================================
   Filter Functions by Variant
 ========================================================= */

export const filterFnByVariant: Record<string, FilterFn<any>> = {
  text: (row, columnId, value) => {
    if (!value) return true;
    return normalize(row.getValue(columnId)).includes(normalize(value));
  },

  select: (row, columnId, value) => {
    if (!value) return true;
    return normalize(row.getValue(columnId)) === normalize(value);
  },

  autocomplete: (row, columnId, value) => {
    if (!value) return true;
    return normalize(row.getValue(columnId)) === normalize(value);
  },

  'multi-select': (row, columnId, value) => {
    if (!Array.isArray(value) || value.length === 0) return true;

    const cell = normalize(row.getValue(columnId));
    return value.some((v) => cell === normalize(v));
  },

  range: (row, columnId, value) => {
    if (!Array.isArray(value)) return true;
    const [min, max] = value;
    const num = Number(row.getValue(columnId));
    if (min != null && num < min) return false;
    if (max != null && num > max) return false;
    return true;
  },
};

/* =========================================================
   Utility Functions
 ========================================================= */

export function setFilterSafe(column: any, value: any) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    column.setFilterValue(undefined);
  } else {
    column.setFilterValue(value);
  }
}

export function getAccessorKey<T extends object>(column: MRTLikeColumnDef<T>): string | undefined {
  return typeof (column as any).accessorKey === 'string' ? ((column as any).accessorKey as string) : undefined;
}

export function buildFilterOptionsFromData<T extends object>(data: T[], columns: MRTLikeColumnDef<T>[]) {
  const result: Record<string, Array<{ label: string; value: any }>> = {};

  columns.forEach((col) => {
    const key = typeof (col as any).accessorKey === 'string' ? ((col as any).accessorKey as keyof T) : undefined;

    if (!key) return;

    if (col.filterVariant !== 'select' && col.filterVariant !== 'multi-select' && col.filterVariant !== 'autocomplete') {
      return;
    }

    const uniqueMap = new Map<string, any>();

    data.forEach((row) => {
      const rawValue = row[key];

      if (rawValue === null || rawValue === undefined || rawValue === '') {
        return;
      }

      const normalizedKey = typeof rawValue === 'string' ? rawValue.trim().toLowerCase() : String(rawValue);

      if (!uniqueMap.has(normalizedKey)) {
        uniqueMap.set(normalizedKey, rawValue);
      }
    });

    if (uniqueMap.size > 0) {
      result[key as string] = Array.from(uniqueMap.values())
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((value) => ({
          label: String(value),
          value,
        }));
    }
  });

  return result;
}
