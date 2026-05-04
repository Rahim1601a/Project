import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGenericQuery, useGenericInfiniteQuery } from './useGenericQuery';
import type { CursorPagedResponse } from '../types/api';
import type { SelectOption } from '../types/common';

export interface UseAutocompleteCursorDataOptions {
  url: string;
  queryKey: any[];
  pageSize?: number;
  isPagination?: boolean;
  isCascading?: boolean;
  parentId?: number | null;
  parentFilterKey?: string;
  isServerSearch?: boolean;
  searchParamName?: string;
  isMulti?: boolean;
  onChange?: (value: SelectOption | SelectOption[] | null) => void;
}

export function useAutocompleteCursorData({
  url,
  queryKey,
  pageSize = 10,
  isPagination = true,
  isCascading = false,
  parentId = null,
  parentFilterKey = '',
  isServerSearch = false,
  searchParamName = 'q',
  isMulti = false,
  onChange,
}: UseAutocompleteCursorDataOptions) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedInputValue, setDebouncedInputValue] = useState('');
  const queryClient = useQueryClient();
  const prevParentIdRef = useRef(parentId);

  // Handle server-side search debouncing
  useEffect(() => {
    if (!isServerSearch) return;
    const timer = setTimeout(() => {
      setDebouncedInputValue(inputValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, isServerSearch]);

  // Compute the effective query key
  const effectiveQueryKey = useMemo(() => {
    const baseKey = isCascading ? [...queryKey, 'cascading', parentFilterKey, parentId] : [...queryKey, 'standard'];
    const modeKey = isPagination ? 'paginated' : 'all';
    const searchKey = isServerSearch ? ['search', debouncedInputValue] : [];
    return [...baseKey, modeKey, ...searchKey, ...(isPagination ? [pageSize] : [])];
  }, [queryKey, isCascading, parentFilterKey, parentId, isPagination, isServerSearch, debouncedInputValue, pageSize]);

  // Compute API parameters
  const apiParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {};
    if (isCascading && parentId != null && parentFilterKey) params[parentFilterKey] = parentId;
    if (isServerSearch && debouncedInputValue) params[searchParamName] = debouncedInputValue;
    return params;
  }, [isCascading, parentId, parentFilterKey, isServerSearch, debouncedInputValue, searchParamName]);

  // Handle cascading parent ID change (reset value)
  useEffect(() => {
    if (isCascading && prevParentIdRef.current !== parentId) {
      if (onChange) onChange(isMulti ? [] : null);
      queryClient.removeQueries({ queryKey });
      prevParentIdRef.current = parentId;
    }
  }, [parentId, isCascading, isMulti, onChange, queryClient, queryKey]);

  const isEnabled = isCascading ? open && parentId != null : true;

  // Fetch paginated data
  const { 
    data: pagedData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isPagedLoading 
  } = useGenericInfiniteQuery<SelectOption>(
    [...effectiveQueryKey, 'infinite'],
    url,
    pageSize,
    apiParams,
    { enabled: isEnabled && isPagination }
  );

  // Fetch all data (non-paginated)
  const { 
    data: allData, 
    isLoading: isAllLoading 
  } = useGenericQuery<any>(
    [...effectiveQueryKey, 'standard'],
    url,
    apiParams,
    { enabled: isEnabled && !isPagination }
  );

  // Consolidate options
  const options = useMemo(() => {
    if (isPagination) return pagedData?.pages.flatMap((page) => (page as CursorPagedResponse<SelectOption>).items) || [];
    if (!allData) return [];
    if (Array.isArray(allData)) return allData;
    const items = allData.items || allData.Items;
    if (Array.isArray(items)) return items;
    return [];
  }, [isPagination, pagedData, allData]);

  const isLoading = isPagination ? isPagedLoading : isAllLoading;

  const handleScrollEnd = useCallback(() => {
    if (isPagination && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isPagination, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    options,
    isLoading,
    isFetchingNextPage,
    handleScrollEnd,
    open,
    setOpen,
    inputValue,
    setInputValue,
    isDisabled: isCascading && parentId == null,
    placeholderText: isCascading && parentId == null ? `Select ${parentFilterKey?.replace('Id', '') || 'parent'} first` : '',
  };
}
