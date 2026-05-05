import { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Grid,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as SalaryIcon,
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useGenericQuery } from '../hooks/useGenericQuery';
import type { Employee, Company } from '../hooks/useEmployeeMutations';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  // Fetch data to make it "working"
  const { data: employeesData, isLoading: loadingEmployees } = useGenericQuery<Employee[]>(['employees', 'all'], '/employees', { pageSize: 100 });
  const { data: companiesData, isLoading: loadingCompanies } = useGenericQuery<Company[]>(['companies', 'all'], '/companies', { pageSize: 100 });

  const employees = (employeesData as any)?.items || [];
  const companies = (companiesData as any)?.items || [];

  const stats = useMemo(() => {
    const totalSalary = employees.reduce((acc: number, curr: Employee) => acc + (curr.salary || 0), 0);
    const avgSalary = employees.length > 0 ? totalSalary / employees.length : 0;

    return [
      {
        title: 'Total Employees',
        value: employees.length,
        change: '+12%',
        icon: <PeopleIcon />,
        color: 'primary.main',
        bg: 'rgba(25, 118, 210, 0.1)',
      },
      {
        title: 'Total Companies',
        value: companies.length,
        change: '+5%',
        icon: <BusinessIcon />,
        color: 'secondary.main',
        bg: 'rgba(156, 39, 176, 0.1)',
      },
      {
        title: 'Avg. Salary',
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(avgSalary),
        change: '+8.4%',
        icon: <SalaryIcon />,
        color: 'success.main',
        bg: 'rgba(46, 125, 50, 0.1)',
      },
      {
        title: 'Growth Rate',
        value: '24.5%',
        change: '+2.1%',
        icon: <TrendingUpIcon />,
        color: 'warning.main',
        bg: 'rgba(237, 108, 2, 0.1)',
      },
    ];
  }, [employees, companies]);

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((e: Employee) => {
      counts[e.department] = (counts[e.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const salaryData = useMemo(() => {
    return employees.slice(0, 8).map((e: Employee) => ({
      name: e.firstName,
      salary: e.salary,
    }));
  }, [employees]);

  if (loadingEmployees || loadingCompanies) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant='h3' sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Insights
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Welcome back! Here's what's happening with your workforce today.
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 24px rgba(0,0,0,0.05)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: stat.bg,
                    color: stat.color,
                    display: 'flex',
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant='subtitle2' color='text.secondary' sx={{ fontWeight: 600 }}>
                  {stat.title}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant='h4' sx={{ fontWeight: 800 }}>
                  {stat.value}
                </Typography>
                <Typography variant='caption' sx={{ color: 'success.main', fontWeight: 700 }}>
                  {stat.change}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', height: '450px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                Salary Distribution (Top 8)
              </Typography>
              <IconButton size='small'>
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 340, width: '100%' }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={salaryData}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='rgba(0,0,0,0.05)' />
                  <XAxis dataKey='name' axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey='salary' fill='#1976d2' radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', height: '450px' }}>
            <Typography variant='h6' sx={{ fontWeight: 700, mb: 4 }}>
              Department Split
            </Typography>
            <Box sx={{ height: 300, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie data={deptData} innerRadius={80} outerRadius={100} paddingAngle={5} dataKey='value'>
                    {deptData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ mt: 2 }}>
              {deptData.slice(0, 3).map((d, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length], mr: 1 }} />
                  <Typography variant='caption' color='text.secondary'>
                    {d.name}: {d.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity & Quick Links */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.01)' }}>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                Recent Hires
              </Typography>
              <Tooltip title='View All'>
                <IconButton size='small' color='primary'>
                  <ArrowForwardIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <List sx={{ p: 0 }}>
              {employees.slice(0, 5).map((e: Employee, i: number) => (
                <Box key={e.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: COLORS[i % COLORS.length], fontWeight: 700 }}>{e.firstName[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${e.firstName} ${e.lastName}`}
                      secondary={`${e.position} • ${e.department}`}
                      slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(e.salary)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Monthly
                      </Typography>
                    </Box>
                  </ListItem>
                  {i < 4 && <Divider variant='inset' component='li' sx={{ opacity: 0.5 }} />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
              color: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant='h4' sx={{ fontWeight: 800, mb: 2 }}>
              Upgrade to Pro
            </Typography>
            <Typography variant='body1' sx={{ opacity: 0.9, mb: 4 }}>
              Get advanced AI insights, automated payroll, and multi-country tax compliance.
            </Typography>
            <Button
              variant='contained'
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 700,
                py: 1.5,
                borderRadius: '12px',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              Start Free Trial
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
