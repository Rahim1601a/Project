import React from 'react';
import { Box, Container, Typography, Grid, Paper, Divider, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { AutocompleteCursorDropdown } from '../components/AutocompleteCursorDropdown';
import type { SelectOption } from '../types/common';

interface DemoFormData {
  serverEmployee: SelectOption | null;
  clientEmployee: SelectOption | null;
}

const AutocompleteDemoPage: React.FC = () => {
  const { control, handleSubmit, watch } = useForm<DemoFormData>({
    defaultValues: {
      serverEmployee: null,
      clientEmployee: null,
    },
  });

  const formValues = watch();

  const onSubmit = (data: DemoFormData) => {
    console.log('Form Submitted:', data);
    alert('Check console for submitted data!');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }} color="primary">
        Unified Autocomplete Component
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This page demonstrates the <code>AutocompleteCursorDropdown</code> component integrated with <strong>React Hook Form</strong>.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          {/* Server Side Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="secondary">
                Server-Side Search & Pagination
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Queries <code>/employees/search</code> with virtualization and infinite scroll. 
                Managed via <code>react-hook-form</code>.
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <AutocompleteCursorDropdown 
                control={control}
                name="serverEmployee"
                url="/employees/search"
                queryKey={['employees', 'search']}
                label="Search Employees (Server)"
                isServerSearch={true}
                isPagination={true}
              />

              {formValues.serverEmployee && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Selected Value:</Typography>
                  <pre style={{ fontSize: '0.75rem' }}>{JSON.stringify(formValues.serverEmployee, null, 2)}</pre>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Client Side Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="secondary">
                Client-Side Filtering
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Fetches all from <code>/employees</code> once and filters locally. 
                Managed via <code>react-hook-form</code>.
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <AutocompleteCursorDropdown 
                control={control}
                name="clientEmployee"
                url="/employees/lookup"
                queryKey={['employees', 'lookup']}
                label="Select Employee (Client Lookup)"
                isServerSearch={false}
                isPagination={false}
              />

              {formValues.clientEmployee && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Selected Value:</Typography>
                  <pre style={{ fontSize: '0.75rem' }}>{JSON.stringify(formValues.clientEmployee, null, 2)}</pre>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button type="submit" variant="contained" size="large" sx={{ px: 6 }}>
            Submit Form
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default AutocompleteDemoPage;
