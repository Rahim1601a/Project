import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
} from '@mui/material';
import { List, useListRef, type RowComponentProps } from 'react-window';
import { Controller, type Control } from 'react-hook-form';
import type { SelectOption } from '../types/common';

// ─── Constants ───────────────────────────────────────────────────────────────
const LISTBOX_PADDING = 8;
const ITEM_SIZE_SM = 36;
const ITEM_SIZE_XS = 48;
const MAX_VISIBLE_ITEMS = 8;

// ─── Virtual Row Component ──────────────────────────────────────────────────
function VirtualRow(props: RowComponentProps & { itemData: any[] }) {
  const { index, style, itemData } = props;
  const item = itemData[index];
  if (!item) return null;
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
  label: string;
  // Data props (instead of URL/Key)
  options: SelectOption[];
  isLoading: boolean;
  onScrollEnd?: () => void;
  onSearchTermChange?: (term: string) => void;
  
  // UI props
  value?: SelectOption | SelectOption[] | null;
  onChange?: (value: SelectOption | SelectOption[] | null) => void;
  isMulti?: boolean;
  error?: boolean;
  helperText?: string;
  isPagination?: boolean;
  isServerSearch?: boolean;
  isDisabled?: boolean;
  placeholderText?: string;
  control?: Control<any>;
  name?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function AutocompleteCursorDropdown({
  label,
  options,
  isLoading,
  onScrollEnd,
  onSearchTermChange,
  value,
  onChange,
  control,
  name,
  isMulti = false,
  error = false,
  helperText = '',
  isPagination = true,
  isServerSearch = false,
  isDisabled = false,
  placeholderText = '',
}: AutocompleteCursorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Handle search term updates (for server-side search)
  useEffect(() => {
    if (isServerSearch && onSearchTermChange) {
      onSearchTermChange(inputValue);
    }
  }, [inputValue, isServerSearch, onSearchTermChange]);

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
        listbox: { component: VirtualListbox, ...(isPagination ? { onScrollEnd } : {}) } as any,
      }}
      renderOption={(props, option) => [props, option] as any}
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
                    {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
