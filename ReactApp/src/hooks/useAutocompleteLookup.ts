import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGenericQuery, useGenericInfiniteQuery } from './useGenericQuery';
import type { CursorPagedResponse } from '../types/api';
import type { SelectOption } from '../types/common';

export interface UseAutocompleteLookupOptions {
  url: string;
  queryKey: any[];
  pageSize?: number;
  isPagination?: boolean;
  isCascading?: boolean;
  parentId?: number | null;
  parentFilterKey?: string;
  isServerSearch?: boolean;
  searchParamName?: string;
  searchTerm?: string; // Raw search term from UI
  isEnabled?: boolean;
}

export function useAutocompleteLookup({
  url,
  queryKey,
  pageSize = 10,
  isPagination = true,
  isCascading = false,
  parentId = null,
  parentFilterKey = '',
  isServerSearch = false,
  searchParamName = 'q',
  searchTerm = '',
  isEnabled = true,
}: UseAutocompleteLookupOptions) {
  const queryClient = useQueryClient();
  const prevParentIdRef = useRef(parentId);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Handle server-side search debouncing internally
  useEffect(() => {
    if (!isServerSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, isServerSearch]);

  // Compute the effective query key
  const effectiveQueryKey = useMemo(() => {
    const baseKey = isCascading ? [...queryKey, 'cascading', parentFilterKey, parentId] : [...queryKey, 'standard'];
    const modeKey = isPagination ? 'paginated' : 'all';
    const searchKey = isServerSearch ? ['search', debouncedSearchTerm] : [];
    return [...baseKey, modeKey, ...searchKey, ...(isPagination ? [pageSize] : [])];
  }, [queryKey, isCascading, parentFilterKey, parentId, isPagination, isServerSearch, debouncedSearchTerm, pageSize]);

  // Compute API parameters
  const apiParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {};
    if (isCascading && parentId != null && parentFilterKey) params[parentFilterKey] = parentId;
    if (isServerSearch && debouncedSearchTerm) params[searchParamName] = debouncedSearchTerm;
    return params;
  }, [isCascading, parentId, parentFilterKey, isServerSearch, debouncedSearchTerm, searchParamName]);

  // Handle cascading parent ID change
  useEffect(() => {
    if (isCascading && prevParentIdRef.current !== parentId) {
      queryClient.removeQueries({ queryKey });
      prevParentIdRef.current = parentId;
    }
  }, [parentId, isCascading, queryClient, queryKey]);

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

  const { 
    data: allData, 
    isLoading: isAllLoading 
  } = useGenericQuery<any>(
    [...effectiveQueryKey, 'standard'],
    url,
    apiParams,
    { enabled: isEnabled && !isPagination }
  );

  const options = useMemo(() => {
    if (isPagination) return pagedData?.pages.flatMap((page) => (page as CursorPagedResponse<SelectOption>).items) || [];
    if (!allData) return [];
    if (Array.isArray(allData)) return allData;
    const items = allData.items || allData.Items;
    if (Array.isArray(items)) return items;
    return [];
  }, [isPagination, pagedData, allData]);

  const isLoading = isPagination ? isPagedLoading : isAllLoading;

  return {
    options,
    isLoading: isLoading || isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
