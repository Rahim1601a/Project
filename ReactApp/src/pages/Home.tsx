import { Box, Typography, Paper } from '@mui/material';


export default function Home() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(156,39,176,0.05) 100%)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Typography variant="h3" color="primary" gutterBottom sx={{ fontWeight: 800 }}>
          Welcome Home
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', maxWidth: '600px' }}>
          This is the main landing page. We've set up a beautiful modern layout using Material UI, with routing and a custom sidebar.
        </Typography>
      </Paper>
      

    </Box>
  );
}
