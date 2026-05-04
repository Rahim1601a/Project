import React, { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';

interface ServerSideAutocompleteProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
}

export const ServerSideAutocomplete: React.FC<ServerSideAutocompleteProps> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const fetchSuggestions = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/employees/search?q=${query}`);
      const result = await response.json();
      if (result.success) {
        setOptions(result.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setOptions([]);
      return;
    }

    if (inputValue.length > 0) {
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
        fetchSuggestions(inputValue);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      fetchSuggestions('');
    }
  }, [inputValue, open, fetchSuggestions]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={options}
      loading={loading}
      getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.position})`}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(x) => x} // Disable client-side filtering
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          slotProps={{
            input: {
              ...params.slotProps?.input,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.slotProps?.input?.endAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
    />
  );
};
