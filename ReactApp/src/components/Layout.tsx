import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';

export function Layout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: '1200px', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
