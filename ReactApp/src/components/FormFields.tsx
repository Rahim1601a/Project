import { Controller, useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@mui/material';

interface FormTextFieldProps extends Omit<TextFieldProps, 'name'> {
  name: string;
}

export function FormTextField({ name, ...props }: FormTextFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...props}
          error={!!error}
          helperText={error ? error.message : props.helperText}
          fullWidth
          variant="outlined"
          sx={{ mb: 2, ...props.sx }}
        />
      )}
    />
  );
}
