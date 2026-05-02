import React, { useState, useMemo, useEffect } from 'react';
import { 
  Autocomplete, 
  CircularProgress, 
  TextField, 
} from '@mui/material';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import type { ApiResponse, CursorPagedResponse } from '../types/api';

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
  /** Enable cascading mode — dropdown depends on a parent selection */
  isCascading?: boolean;
  /** The parent's selected ID — required when isCascading is true */
  parentId?: number | null;
  /** The query param name to send for parent filtering (e.g., 'companyId') */
  parentFilterKey?: string;
}

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
  isCascading = false,
  parentId = null,
  parentFilterKey = '',
}: AutocompleteCursorDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Build the effective query key including parent filter for cascading
  const effectiveQueryKey = isCascading
    ? [...queryKey, parentFilterKey, parentId, pageSize]
    : [...queryKey, pageSize];

  // When parent changes in cascading mode, reset selection and clear cache
  useEffect(() => {
    if (isCascading) {
      // Reset the value when parent changes
      if (isMulti) {
        onChange([] as any);
      } else {
        onChange(null);
      }
      // Invalidate previous queries for this dropdown
      queryClient.removeQueries({ queryKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  // Determine if the query should be enabled
  const isEnabled = isCascading
    ? open && parentId != null && parentId !== undefined
    : open;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<CursorPagedResponse<T>, Error, InfiniteData<CursorPagedResponse<T>, number | null>, any[], number | null>({
    queryKey: effectiveQueryKey,
    queryFn: async ({ pageParam = null }) => {
      const params: Record<string, string | number | boolean> = { pageSize };
      if (pageParam !== null) {
        params.cursor = pageParam;
      }
      // Add parent filter param for cascading
      if (isCascading && parentId != null && parentFilterKey) {
        params[parentFilterKey] = parentId;
      }
      const response = await apiClient<ApiResponse<CursorPagedResponse<T>>>(url, { params });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isEnabled,
  });

  const options = useMemo(() => {
    return data?.pages.flatMap((page) => (page as CursorPagedResponse<T>).items) || [];
  }, [data]);

  const handleScroll = (event: React.SyntheticEvent) => {
    const listboxNode = event.currentTarget;
    if (
      listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

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
          onScroll: handleScroll,
          style: { maxHeight: '200px' },
        },
      }}
      renderInput={(params) => (
        <TextField
          id={params.id}
          disabled={params.disabled}
          fullWidth={params.fullWidth}
          size={params.size}
          label={label}
          variant="outlined"
          error={error}
          helperText={helperText || placeholderText}
          slotProps={{
            inputLabel: params.slotProps.inputLabel,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <React.Fragment>
                  {isLoading || isFetchingNextPage ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.slotProps.input.endAdornment}
                </React.Fragment>
              ),
            },
            htmlInput: params.slotProps.htmlInput,
          }}
        />
      )}
    />
  );
}
