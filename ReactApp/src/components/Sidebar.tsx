import { Link, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

export const DRAWER_WIDTH = 280;

const MENU_ITEMS = [
  { text: 'Home', path: '/', icon: <HomeRoundedIcon /> },
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardRoundedIcon /> },
  { text: 'Employees', path: '/employees', icon: <PeopleRoundedIcon /> },
  { text: 'Autocomplete', path: '/autocomplete', icon: <SearchRoundedIcon /> },
  { text: 'Table Demo', path: '/table', icon: <SearchRoundedIcon /> }, // Added
  { text: 'Settings', path: '/settings', icon: <SettingsRoundedIcon /> },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant='permanent'
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0,0,0,0.05)',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
        },
      }}
    >
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.2rem',
            boxShadow: '0 8px 16px rgba(25,118,210,0.3)',
          }}
        >
          R
        </Box>
        <Typography
          variant='h5'
          sx={{
            fontWeight: 800,
            background: '-webkit-linear-gradient(45deg, #1976d2, #9c27b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ReactApp
        </Typography>
      </Box>
      <Box sx={{ overflow: 'auto', px: 2, mt: 2 }}>
        <List>
          {MENU_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.text} component='div' disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: active ? 'linear-gradient(90deg, rgba(25, 118, 210, 0.08) 0%, transparent 100%)' : 'transparent',
                    color: active ? 'primary.main' : 'text.secondary',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '10%',
                      height: '80%',
                      width: '4px',
                      borderRadius: '0 4px 4px 0',
                      background: active ? '#1976d2' : 'transparent',
                      transition: 'all 0.2s',
                    },
                    '&:hover': {
                      background: active ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0,0,0,0.04)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 44, color: active ? 'primary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontWeight: active ? 700 : 500, fontSize: '1.05rem' }}>{item.text}</Typography>} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
