import { Box, Typography, Paper } from '@mui/material';

export default function Settings() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" color="text.primary" sx={{ fontWeight: 800 }}>
        Settings
      </Typography>
      
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" gutterBottom>Profile Settings</Typography>
        <Typography color="text.secondary">Configure your app settings here.</Typography>
      </Paper>
    </Box>
  );
}
