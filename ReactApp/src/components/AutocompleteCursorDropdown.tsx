import React, { useState, useMemo } from 'react';
import { 
  Autocomplete, 
  CircularProgress, 
  TextField, 
} from '@mui/material';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
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
}: AutocompleteCursorDropdownProps<T>) {
  const [open, setOpen] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<CursorPagedResponse<T>, Error, InfiniteData<CursorPagedResponse<T>, number | null>, any[], number | null>({
    queryKey: [...queryKey, pageSize],
    queryFn: async ({ pageParam = null }) => {
      const params: Record<string, string | number | boolean> = { pageSize };
      if (pageParam !== null) {
        params.cursor = pageParam;
      }
      const response = await apiClient<ApiResponse<CursorPagedResponse<T>>>(url, { params });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: open,
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

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      multiple={isMulti as any}
      options={options}
      loading={isLoading}
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
          helperText={helperText}
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
