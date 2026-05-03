import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useGenericQuery, useGenericInfiniteQuery } from '../hooks/useGenericQuery';
import type { CursorPagedResponse } from '../types/api';
import { List, useListRef, type RowComponentProps } from 'react-window';

// ─── Constants ───────────────────────────────────────────────────────────────
const LISTBOX_PADDING = 8; // px — top/bottom padding inside the virtual list
const ITEM_SIZE_SM = 36;   // row height on sm+ screens
const ITEM_SIZE_XS = 48;   // row height on xs screens
const MAX_VISIBLE_ITEMS = 8;

// ─── Virtual Row Component ──────────────────────────────────────────────────
/** Renders a single virtualised row inside the dropdown. */
function VirtualRow(props: RowComponentProps & { itemData: any[] }) {
  const { index, style, itemData } = props;
  const item = itemData[index];

  if (!item) return null;

  // item is [props, label] as returned by renderOption
  const [liProps, label] = item;

  return (
    <Box
      component="li"
      {...liProps}
      style={{
        ...style,
        ...liProps.style,
        top: ((style.top as number) ?? 0) + LISTBOX_PADDING,
        boxSizing: 'border-box',
      }}
    >
      {label}
    </Box>
  );
}

// ─── Virtualised Listbox ────────────────────────────────────────────────────
/**
 * A custom MUI Autocomplete listbox that virtualises its children using
 * react-window v2's `<List>`. It receives `onScrollEnd` through slotProps
 * so we can trigger `fetchNextPage` when the user scrolls near the bottom.
 */
const VirtualListbox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement> & { onScrollEnd?: () => void }
>(function VirtualListbox(props, ref) {
  const { children, onScrollEnd, ...rest } = props;
  const listRef = useListRef(null);

  // Flatten MUI's grouped children into a plain array of ReactNodes
  const items = useMemo(() => {
    if (!children) return [];
    return children as any[];
  }, [children]);

  const itemCount = items.length;

  // Determine row height based on viewport width (matches MUI default sizing)
  const isSmUp =
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width:600px)').matches;
  const itemSize = isSmUp ? ITEM_SIZE_SM : ITEM_SIZE_XS;

  // Calculate total list height (capped at MAX_VISIBLE_ITEMS rows)
  const listHeight =
    itemCount > MAX_VISIBLE_ITEMS
      ? MAX_VISIBLE_ITEMS * itemSize + 2 * LISTBOX_PADDING
      : itemCount * itemSize + 2 * LISTBOX_PADDING;

  // Infinite-scroll: detect when the user is near the bottom
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const target = e.currentTarget;
      if (
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - 5 // Added a bit of threshold
      ) {
        onScrollEnd?.();
      }
    },
    [onScrollEnd],
  );

  // Separate className / style so we can forward ARIA & handler props to the
  // outer wrapper while giving List its own styling.
  const { className, style: _style, ...wrapperProps } = rest;

  return (
    <div ref={ref} {...wrapperProps} onScroll={handleScroll as any}>
      <List
        className={className}
        listRef={listRef}
        key={itemCount}
        rowCount={itemCount}
        rowHeight={itemSize}
        rowComponent={VirtualRow}
        rowProps={{ itemData: items }}
        style={{
          height: listHeight,
          width: '100%',
          overflowX: 'hidden',
        }}
        overscanCount={5}
        tagName="div"
      />
    </div>
  );
});

// ─── Component Props ────────────────────────────────────────────────────────
interface AutocompleteCursorDropdownProps<T> {
  url: string;
  queryKey: any[];
  label: string;
  value: T | T[] | null;
  onChange: (value: T | T[] | null) => void;
  getOptionLabel: (option: T) => string;
  isMulti?: boolean;
  error?: boolean;
  helperText?: string;
  pageSize?: number;
  /** When true (default), uses cursor-based infinite scroll pagination.
   *  When false, fetches all data in a single request. */
  isPagination?: boolean;
  /** Enable cascading mode — dropdown depends on a parent selection */
  isCascading?: boolean;
  /** The parent's selected ID — required when isCascading is true */
  parentId?: number | null;
  /** The query param name to send for parent filtering (e.g., 'companyId') */
  parentFilterKey?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function AutocompleteCursorDropdown<T extends { id: number }>({
  url,
  queryKey,
  label,
  value,
  onChange,
  getOptionLabel,
  isMulti = false,
  error = false,
  helperText = '',
  pageSize = 10,
  isPagination = true,
  isCascading = false,
  parentId = null,
  parentFilterKey = '',
}: AutocompleteCursorDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const prevParentIdRef = React.useRef(parentId);

  // Build the effective query key including parent filter for cascading and pagination mode
  const effectiveQueryKey = isCascading
    ? [...queryKey, 'cascading', parentFilterKey, parentId, isPagination ? 'paginated' : 'all', ...(isPagination ? [pageSize] : [])]
    : [...queryKey, 'standard', isPagination ? 'paginated' : 'all', ...(isPagination ? [pageSize] : [])];

  // When parent changes in cascading mode, reset selection and clear cache
  useEffect(() => {
    if (isCascading && prevParentIdRef.current !== parentId) {
      // Reset the value when parent changes
      if (isMulti) {
        onChange([] as any);
      } else {
        onChange(null);
      }
      // Invalidate previous queries for this dropdown
      queryClient.removeQueries({ queryKey });
      prevParentIdRef.current = parentId;
    }
  }, [parentId, isCascading, isMulti, onChange, queryClient, queryKey]);

  // Determine if the query should be enabled
  const isEnabled = isCascading
    ? open && parentId != null && parentId !== undefined
    : true; // Always enabled for non-cascading to fetch on mount or stay ready

  // ── Paginated mode (cursor-based infinite scroll) using generic hook ─────
  const {
    data: pagedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPagedLoading,
  } = useGenericInfiniteQuery<T>(
    [...effectiveQueryKey, 'infinite'],
    url,
    pageSize,
    isCascading && parentId != null && parentFilterKey ? { [parentFilterKey]: parentId } : {},
    { enabled: isEnabled && isPagination }
  );

  // ── Non-paginated mode (fetch all data at once) using generic hook ───────
  const {
    data: allData,
    isLoading: isAllLoading,
  } = useGenericQuery<T[]>(
    [...effectiveQueryKey, 'standard'],
    url,
    isCascading && parentId != null && parentFilterKey ? { [parentFilterKey]: parentId } : {},
    { enabled: isEnabled && !isPagination }
  );

  // ── Merge options from whichever mode is active ──────────────────────────
  const options = useMemo(() => {
    if (isPagination) {
      return pagedData?.pages.flatMap((page) => (page as CursorPagedResponse<T>).items) || [];
    }

    if (!allData) return [];
    
    // API response is ApiResponse<CursorPagedResponse<T>>
    // useGenericQuery select returns response.data
    // So allData is CursorPagedResponse<T> (or the direct array if not paginated)
    if (Array.isArray(allData)) return allData;
    
    if (typeof allData === 'object') {
      const items = (allData as any).items || (allData as any).Items;
      if (Array.isArray(items)) return items;
    }
    
    return [];
  }, [isPagination, pagedData, allData]);

  const isLoading = isPagination ? isPagedLoading : isAllLoading;

  // Trigger next page fetch when the virtual list is scrolled to the bottom
  const handleScrollEnd = useCallback(() => {
    if (isPagination && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isPagination, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Determine if the dropdown should be disabled
  const isDisabled = isCascading && (parentId == null || parentId === undefined);
  const placeholderText = isDisabled ? `Select ${parentFilterKey?.replace('Id', '') || 'parent'} first` : '';

  return (
    <Autocomplete
      open={open}
      onOpen={() => { if (!isDisabled) setOpen(true); }}
      onClose={() => setOpen(false)}
      multiple={isMulti as any}
      options={options}
      loading={isLoading}
      disabled={isDisabled}
      value={value as any}
      onChange={(_: any, newValue: any) => onChange(newValue)}
      getOptionLabel={getOptionLabel as any}
      isOptionEqualToValue={(option: any, val: any) => option.id === val.id}
      slotProps={{
        listbox: {
          component: VirtualListbox,
          ...(isPagination ? { onScrollEnd: handleScrollEnd } : {}),
        } as any,
      }}
      renderOption={(props, option) => [props, getOptionLabel(option)] as any}
      renderInput={(params) => {
        const { slotProps: paramsSlotProps, ...otherParams } = params;
        return (
          <TextField
            {...otherParams}
            label={label}
            variant="outlined"
            error={error}
            helperText={helperText || placeholderText}
            slotProps={{
              ...paramsSlotProps,
              input: {
                ...paramsSlotProps?.input,
                endAdornment: (
                  <React.Fragment>
                    {isLoading || (isPagination && isFetchingNextPage) ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {paramsSlotProps?.input?.endAdornment}
                  </React.Fragment>
                ),
              },
            }}
          />
        );
      }}

    />
  );
}
