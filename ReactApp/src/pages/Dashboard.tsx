import { Box, Typography, Paper, Grid } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import TimelineIcon from '@mui/icons-material/Timeline';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

export default function Dashboard() {
  const stats = [
    { title: 'Total Users', value: '12,431', icon: <GroupIcon sx={{ fontSize: 40, opacity: 0.8 }} />, color: '#1976d2' },
    { title: 'Engagement', value: '84.2%', icon: <TimelineIcon sx={{ fontSize: 40, opacity: 0.8 }} />, color: '#9c27b0' },
    { title: 'Revenue', value: '$45,200', icon: <AutoGraphIcon sx={{ fontSize: 40, opacity: 0.8 }} />, color: '#2e7d32' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" color="text.primary" sx={{ fontWeight: 800 }}>
        Dashboard Analytics
      </Typography>
      
      <Grid container spacing={3}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`,
                color: 'white',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                '&:hover': { 
                  transform: 'translateY(-8px)', 
                  boxShadow: `0 20px 40px -15px ${stat.color}88` 
                }
              }}
            >
              <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.2, transform: 'scale(2)' }}>
                {stat.icon}
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500, mb: 1 }}>
                {stat.title}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">More dashboard content could go here...</Typography>
      </Paper>
    </Box>
  );
}
