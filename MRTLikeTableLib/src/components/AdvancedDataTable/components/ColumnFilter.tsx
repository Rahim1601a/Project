import React from 'react';
import { Box, Checkbox, TextField, InputAdornment, Autocomplete, MenuItem, Slider } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import Flatpickr from 'react-flatpickr';
import Select from 'react-select';
import { setFilterSafe } from '../utils/filters';

/* =========================================================
   Types
========================================================= */

interface FilterProps {
  column: any;
  localValue: any;
  setLocalValue: (val: any) => void;
  options: Array<string | { label?: string; value: any }>;
}

/* =========================================================
   Filter Variant Components
========================================================= */

const TextFilter = ({ localValue, setLocalValue }: FilterProps) => (
  <TextField
    size='small'
    variant='outlined'
    value={(localValue as string) ?? ''}
    placeholder='Filter…'
    onChange={(e) => setLocalValue(e.target.value || undefined)}
    sx={{ width: '100%' }}
    slotProps={{
      input: {
        sx: { fontSize: '0.75rem', mt: 0.5 },
        startAdornment: (
          <InputAdornment position='start'>
            <Search sx={{ fontSize: '0.9rem', opacity: 0.5 }} />
          </InputAdornment>
        ),
        endAdornment: localValue ? (
          <InputAdornment position='end'>
            <Clear fontSize='small' sx={{ cursor: 'pointer' }} onClick={() => setLocalValue(undefined)} />
          </InputAdornment>
        ) : null,
      },
    }}
  />
);

const SelectFilter = ({ localValue, setLocalValue, options }: FilterProps) => (
  <TextField
    select
    size='small'
    value={(localValue as string) ?? ''}
    onChange={(e) => setLocalValue(e.target.value || undefined)}
    sx={{ mt: 0.5, width: '100%' }}
  >
    <MenuItem value=''>All</MenuItem>
    {options.map((opt) => {
      const optValue = typeof opt === 'string' ? opt : opt.value;
      const optLabel = typeof opt === 'string' ? opt : opt.label || opt.value;
      return (
        <MenuItem key={optValue} value={optValue}>
          {optLabel}
        </MenuItem>
      );
    })}
  </TextField>
);

const CheckboxFilter = ({ localValue, setLocalValue }: FilterProps) => (
  <Checkbox size='small' checked={localValue === 'Y'} onChange={(e) => setLocalValue(e.target.checked ? 'Y' : undefined)} sx={{ mt: 0.5 }} />
);

const RangeFilter = ({ column, localValue, setLocalValue }: FilterProps) => {
  const [min, max] = (localValue as [any, any]) ?? [];
  const facetedMinMax = column.getFacetedMinMaxValues();

  return (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, width: '100%' }}>
      <TextField
        size='small'
        placeholder={facetedMinMax?.[0] ? `Min (${facetedMinMax[0]})` : 'Min'}
        type='number'
        value={min ?? ''}
        onChange={(e) => setLocalValue([e.target.value || undefined, max])}
        sx={{ width: '50%' }}
      />
      <TextField
        size='small'
        placeholder={facetedMinMax?.[1] ? `Max (${facetedMinMax[1]})` : 'Max'}
        type='number'
        value={max ?? ''}
        onChange={(e) => setLocalValue([min, e.target.value || undefined])}
        sx={{ width: '50%' }}
      />
    </Box>
  );
};

const AutocompleteFilter = ({ localValue, setLocalValue, options: rawOptions }: FilterProps) => {
  const options = rawOptions.map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt));
  return (
    <Autocomplete
      size='small'
      options={options}
      getOptionLabel={(option: any) => option.label || option.value}
      value={options.find((opt: any) => opt.value === localValue) || null}
      onChange={(_, newValue) => setLocalValue(newValue?.value || undefined)}
      renderInput={(params) => <TextField {...params} placeholder='Select...' sx={{ mt: 0.5, width: '100%' }} />}
      sx={{ width: '100%' }}
    />
  );
};

const DateFilter = ({ localValue, setLocalValue }: FilterProps) => (
  <Flatpickr
    value={localValue ? new Date(localValue as string) : undefined}
    onChange={(dates: Date[]) => setLocalValue(dates[0] ? dates[0].toISOString().split('T')[0] : undefined)}
    options={{ dateFormat: 'Y-m-d' }}
    render={({ defaultValue, value, ...props }: any, ref: any) => (
      <TextField {...props} inputRef={ref} size='small' placeholder='Select date...' sx={{ mt: 0.5, width: '100%' }} value={value} />
    )}
  />
);

const DateRangeFilter = ({ localValue, setLocalValue }: FilterProps) => {
  const [start, end] = (localValue as [string, string]) ?? [];
  return (
    <Flatpickr
      value={start && end ? [new Date(start), new Date(end)] : []}
      onChange={(dates: Date[]) => {
        if (dates.length === 2) {
          setLocalValue([dates[0].toISOString().split('T')[0], dates[1].toISOString().split('T')[0]]);
        } else {
          setLocalValue(undefined);
        }
      }}
      options={{ mode: 'range', dateFormat: 'Y-m-d' }}
      render={({ defaultValue, value, ...props }: any, ref: any) => (
        <TextField {...props} inputRef={ref} size='small' placeholder='Select date range...' sx={{ mt: 0.5, width: '100%' }} value={value} />
      )}
    />
  );
};

const DateTimeFilter = ({ localValue, setLocalValue }: FilterProps) => (
  <Flatpickr
    value={localValue ? new Date(localValue as string) : undefined}
    onChange={(dates: Date[]) => setLocalValue(dates[0] ? dates[0].toISOString() : undefined)}
    options={{ enableTime: true, dateFormat: 'Y-m-d H:i' }}
    render={({ defaultValue, value, ...props }: any, ref: any) => (
      <TextField {...props} inputRef={ref} size='small' placeholder='Select datetime...' sx={{ mt: 0.5, width: '100%' }} value={value} />
    )}
  />
);

const DateTimeRangeFilter = ({ localValue, setLocalValue }: FilterProps) => {
  const [start, end] = (localValue as [string, string]) ?? [];
  return (
    <Flatpickr
      value={start && end ? [new Date(start), new Date(end)] : []}
      onChange={(dates: Date[]) => {
        if (dates.length === 2) {
          setLocalValue([dates[0].toISOString(), dates[1].toISOString()]);
        } else {
          setLocalValue(undefined);
        }
      }}
      options={{ mode: 'range', enableTime: true, dateFormat: 'Y-m-d H:i' }}
      render={({ defaultValue, value, ...props }: any, ref: any) => (
        <TextField {...props} inputRef={ref} size='small' placeholder='Select datetime range...' sx={{ mt: 0.5, width: '100%' }} value={value} />
      )}
    />
  );
};

const MultiSelectFilter = ({ localValue, setLocalValue, options: rawOptions }: FilterProps) => {
  const options = rawOptions.map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt));
  const selectedValues = (localValue as string[]) ?? [];
  const selectedOptions = options.filter((opt: any) => selectedValues.includes(opt.value));
  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      menuPortalTarget={document.body}
      menuPosition='fixed'
      onChange={(newValues) => {
        const values = Array.isArray(newValues) ? newValues.map((v) => v.value) : [];
        setLocalValue(values.length ? values : undefined);
      }}
      styles={{
        control: (base) => ({ ...base, minHeight: 32, fontSize: '0.75rem', zIndex: 1 }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};

const RangeSliderFilter = ({ column, localValue, setLocalValue }: FilterProps) => {
  const [min, max] = (localValue as [number, number]) ?? [0, 100];
  const facetedMinMax = column.getFacetedMinMaxValues();
  const sliderMin = facetedMinMax?.[0] ?? 0;
  const sliderMax = facetedMinMax?.[1] ?? 100;
  return (
    <Box sx={{ mt: 0.5, px: 1 }}>
      <Slider
        value={[min, max]}
        onChange={(_, newValue) => setLocalValue(newValue as [number, number])}
        valueLabelDisplay='auto'
        min={sliderMin}
        max={sliderMax}
        sx={{ width: '100%' }}
      />
    </Box>
  );
};

const TimeFilter = ({ localValue, setLocalValue }: FilterProps) => (
  <Flatpickr
    value={localValue ? new Date(`1970-01-01T${localValue as string}`) : undefined}
    onChange={(dates: Date[]) => setLocalValue(dates[0] ? dates[0].toTimeString().split(' ')[0] : undefined)}
    options={{ enableTime: true, noCalendar: true, dateFormat: 'H:i' }}
    render={({ defaultValue, value, ...props }: any, ref: any) => (
      <TextField {...props} inputRef={ref} size='small' placeholder='Select time...' sx={{ mt: 0.5, width: '100%' }} value={value} />
    )}
  />
);

const TimeRangeFilter = ({ localValue, setLocalValue }: FilterProps) => {
  const [start, end] = (localValue as [string, string]) ?? [];
  return (
    <Flatpickr
      value={start && end ? [new Date(`1970-01-01T${start}`), new Date(`1970-01-01T${end}`)] : []}
      onChange={(dates: Date[]) => {
        if (dates.length === 2) {
          setLocalValue([dates[0].toTimeString().split(' ')[0], dates[1].toTimeString().split(' ')[0]]);
        } else {
          setLocalValue(undefined);
        }
      }}
      options={{ mode: 'range', enableTime: true, noCalendar: true, dateFormat: 'H:i' }}
      render={({ defaultValue, value, ...props }: any, ref: any) => (
        <TextField {...props} inputRef={ref} size='small' placeholder='Select time range...' sx={{ mt: 0.5, width: '100%' }} value={value} />
      )}
    />
  );
};

/* =========================================================
   Component Map
========================================================= */

const FILTER_COMPONENTS: Record<string, React.FC<FilterProps>> = {
  text: TextFilter,
  select: SelectFilter,
  checkbox: CheckboxFilter,
  range: RangeFilter,
  autocomplete: AutocompleteFilter,
  date: DateFilter,
  'date-range': DateRangeFilter,
  datetime: DateTimeFilter,
  'datetime-range': DateTimeRangeFilter,
  'multi-select': MultiSelectFilter,
  'range-slider': RangeSliderFilter,
  time: TimeFilter,
  'time-range': TimeRangeFilter,
};

/* =========================================================
   Main ColumnFilter Component
========================================================= */

export const ColumnFilter = React.memo(function ColumnFilter({
  column,
  filterOptions,
}: {
  column: any;
  filterOptions?: Record<string, Array<string | { label?: string; value: any }>>;
}) {
  const variant = column.columnDef.filterVariant ?? 'text';
  const columnFilterValue = column.getFilterValue();
  const accessorKey = typeof column.columnDef.accessorKey === 'string' ? column.columnDef.accessorKey : undefined;

  const columnFilterOptions = React.useMemo(() => (accessorKey ? (filterOptions?.[accessorKey] ?? []) : []), [accessorKey, filterOptions]);

  // Local state for debouncing input to prevent lag and focus loss
  const [localValue, setLocalValue] = React.useState(columnFilterValue);
  const lastPushedValue = React.useRef(columnFilterValue);

  // Sync external changes (e.g., clearing filters globally) to local state
  React.useEffect(() => {
    if (columnFilterValue === undefined) {
      setLocalValue(undefined);
      lastPushedValue.current = undefined;
      return;
    }

    if (JSON.stringify(columnFilterValue) !== JSON.stringify(lastPushedValue.current)) {
      setLocalValue(columnFilterValue);
      lastPushedValue.current = columnFilterValue;
    }
  }, [columnFilterValue]);

  // Debounce effect to apply filter after user stops typing
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (JSON.stringify(localValue) !== JSON.stringify(columnFilterValue)) {
        lastPushedValue.current = localValue;
        setFilterSafe(column, localValue);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [localValue, columnFilterValue, column]);

  if (!column.getCanFilter()) return null;

  const FilterComponent = FILTER_COMPONENTS[variant] || FILTER_COMPONENTS.text;

  return <FilterComponent column={column} localValue={localValue} setLocalValue={setLocalValue} options={columnFilterOptions} />;
});
