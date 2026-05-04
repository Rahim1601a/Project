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
import { Controller, type Control } from 'react-hook-form';
import type { SelectOption } from '../types/common';

// ─── Constants ───────────────────────────────────────────────────────────────
const LISTBOX_PADDING = 8; // px — top/bottom padding inside the virtual list
const ITEM_SIZE_SM = 36;   // row height on sm+ screens
const ITEM_SIZE_XS = 48;   // row height on xs screens
const MAX_VISIBLE_ITEMS = 8;

// ─── Virtual Row Component ──────────────────────────────────────────────────
function VirtualRow(props: RowComponentProps & { itemData: any[] }) {
  const { index, style, itemData } = props;
  const item = itemData[index];
  if (!item) return null;
  
  // The item is [props, option]
  const [liProps, option] = item;
  
  return (
    <Box
      component="li"
      {...liProps}
      key={option.value}
      style={{
        ...style,
        ...liProps.style,
        top: ((style.top as number) ?? 0) + LISTBOX_PADDING,
        boxSizing: 'border-box',
      }}
    >
      {option.label}
    </Box>
  );
}

// ─── Virtualised Listbox ────────────────────────────────────────────────────
const VirtualListbox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement> & { onScrollEnd?: () => void }
>(function VirtualListbox(props, ref) {
  const { children, onScrollEnd, ...rest } = props;
  const listRef = useListRef(null);
  const items = useMemo(() => (children ? (children as any[]) : []), [children]);
  const itemCount = items.length;
  const isSmUp = typeof window !== 'undefined' && window.matchMedia('(min-width:600px)').matches;
  const itemSize = isSmUp ? ITEM_SIZE_SM : ITEM_SIZE_XS;
  const listHeight = itemCount > MAX_VISIBLE_ITEMS ? MAX_VISIBLE_ITEMS * itemSize + 2 * LISTBOX_PADDING : itemCount * itemSize + 2 * LISTBOX_PADDING;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const target = e.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 5) {
        onScrollEnd?.();
      }
    },
    [onScrollEnd]
  );

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
        style={{ height: listHeight, width: '100%', overflowX: 'hidden' }}
        overscanCount={5}
        tagName="div"
      />
    </div>
  );
});

// ─── Component Props ────────────────────────────────────────────────────────
interface AutocompleteCursorDropdownProps {
  url: string;
  queryKey: any[];
  label: string;
  value?: SelectOption | SelectOption[] | null;
  onChange?: (value: SelectOption | SelectOption[] | null) => void;
  isMulti?: boolean;
  error?: boolean;
  helperText?: string;
  pageSize?: number;
  isPagination?: boolean;
  isCascading?: boolean;
  parentId?: number | null;
  parentFilterKey?: string;
  isServerSearch?: boolean;
  searchParamName?: string;
  control?: Control<any>;
  name?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function AutocompleteCursorDropdown({
  url,
  queryKey,
  label,
  value,
  onChange,
  control,
  name,
  isMulti = false,
  error = false,
  helperText = '',
  pageSize = 10,
  isPagination = true,
  isCascading = false,
  parentId = null,
  parentFilterKey = '',
  isServerSearch = false,
  searchParamName = 'q',
}: AutocompleteCursorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedInputValue, setDebouncedInputValue] = useState('');
  const queryClient = useQueryClient();
  const prevParentIdRef = React.useRef(parentId);

  useEffect(() => {
    if (!isServerSearch) return;
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setDebouncedInputValue(inputValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, isServerSearch]);

  const effectiveQueryKey = useMemo(() => {
    const baseKey = isCascading ? [...queryKey, 'cascading', parentFilterKey, parentId] : [...queryKey, 'standard'];
    const modeKey = isPagination ? 'paginated' : 'all';
    const searchKey = isServerSearch ? ['search', debouncedInputValue] : [];
    return [...baseKey, modeKey, ...searchKey, ...(isPagination ? [pageSize] : [])];
  }, [queryKey, isCascading, parentFilterKey, parentId, isPagination, isServerSearch, debouncedInputValue, pageSize]);

  const apiParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {};
    if (isCascading && parentId != null && parentFilterKey) params[parentFilterKey] = parentId;
    if (isServerSearch && debouncedInputValue) params[searchParamName] = debouncedInputValue;
    return params;
  }, [isCascading, parentId, parentFilterKey, isServerSearch, debouncedInputValue, searchParamName]);

  useEffect(() => {
    if (isCascading && prevParentIdRef.current !== parentId) {
      if (onChange) onChange(isMulti ? [] : null);
      queryClient.removeQueries({ queryKey });
      prevParentIdRef.current = parentId;
    }
  }, [parentId, isCascading, isMulti, onChange, queryClient, queryKey]);

  const isEnabled = isCascading ? open && parentId != null : true;

  const { data: pagedData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isPagedLoading } = useGenericInfiniteQuery<SelectOption>(
    [...effectiveQueryKey, 'infinite'],
    url,
    pageSize,
    apiParams,
    { enabled: isEnabled && isPagination }
  );

  const { data: allData, isLoading: isAllLoading } = useGenericQuery<any>(
    [...effectiveQueryKey, 'standard'],
    url,
    apiParams,
    { enabled: isEnabled && !isPagination }
  );

  const options = useMemo(() => {
    if (isPagination) return pagedData?.pages.flatMap((page) => (page as CursorPagedResponse<SelectOption>).items) || [];
    if (!allData) return [];
    if (Array.isArray(allData)) return allData;
    // Handle CursorPagedResponseModel wrapper
    const items = allData.items || allData.Items;
    if (Array.isArray(items)) return items;
    return [];
  }, [isPagination, pagedData, allData]);

  const isLoading = isPagination ? isPagedLoading : isAllLoading;

  const handleScrollEnd = useCallback(() => {
    if (isPagination && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isPagination, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isDisabled = isCascading && parentId == null;
  const placeholderText = isDisabled ? `Select ${parentFilterKey?.replace('Id', '') || 'parent'} first` : '';

  const renderAutocomplete = (currentValue: any, currentOnChange: (val: any) => void, currentError?: boolean, currentHelperText?: string) => (
    <Autocomplete
      open={open}
      onOpen={() => { if (!isDisabled) setOpen(true); }}
      onClose={() => setOpen(false)}
      multiple={isMulti as any}
      options={options}
      loading={isLoading}
      disabled={isDisabled}
      value={currentValue as any}
      onChange={(_: any, newValue: any) => currentOnChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_: any, newInputValue: any) => setInputValue(newInputValue)}
      getOptionLabel={(option: SelectOption) => option.label || option.value?.toString() || ''}
      isOptionEqualToValue={(option: SelectOption, val: SelectOption) => option.value === val.value}
      filterOptions={isServerSearch ? (x) => x : undefined}
      slotProps={{
        listbox: { component: VirtualListbox, ...(isPagination ? { onScrollEnd: handleScrollEnd } : {}) } as any,
      }}
      renderOption={(props, option) => {
        // We pass the option object along with props to the virtual row
        return [props, option] as any;
      }}
      renderInput={(params) => {
        const { slotProps: paramsSlotProps, ...otherParams } = params;
        return (
          <TextField
            {...otherParams}
            label={label}
            variant="outlined"
            error={currentError}
            helperText={currentHelperText || placeholderText}
            slotProps={{
              ...paramsSlotProps,
              input: {
                ...paramsSlotProps?.input,
                endAdornment: (
                  <React.Fragment>
                    {isLoading || (isPagination && isFetchingNextPage) ? <CircularProgress color="inherit" size={20} /> : null}
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

  if (control && name) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: { value: fieldValue, onChange: fieldOnChange }, fieldState: { error: fieldError } }) => 
          renderAutocomplete(fieldValue, fieldOnChange, error || !!fieldError, helperText || fieldError?.message)
        }
      />
    );
  }
  return renderAutocomplete(value, onChange, error, helperText);
}
