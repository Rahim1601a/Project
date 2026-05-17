import { useState, memo } from 'react';
import type { Table } from '@tanstack/react-table';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Checkbox,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  FilterListOff,
  Download,
  ViewColumn,
  RestartAlt,
  Fullscreen,
  FullscreenExit,
  TableRows,
  PictureAsPdf,
  DensitySmall,
  DensityMedium,
  DensityLarge,
} from '@mui/icons-material';

import { ADTToolbar } from './AdvancedDataTable.styles';
import type { ADTDensity, ADTExportParams } from '../types/types';
import { getAriaLabel } from '../utils/accessibility.utils';

interface Props<T extends object> {
  table: Table<T>;
  title?: string;
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  enableHiding?: boolean;
  enableFullScreen?: boolean;
  enableDensity?: boolean;
  isFullScreen?: boolean;
  toggleFullScreen: () => void;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  density: ADTDensity;
  setDensity: (val: ADTDensity) => void;
  resetState: () => void;
  onExport?: (params: ADTExportParams) => Promise<void>;
  renderTopToolbarCustomActions?: (props: { table: Table<T> }) => React.ReactNode;
}

function AdvancedDataTableToolbarInner<T extends object>({
  table,
  title,
  enableGlobalFilter,
  enableColumnFilters,
  enableHiding,
  enableFullScreen,
  isFullScreen,
  toggleFullScreen,
  showFilters,
  setShowFilters,
  density,
  setDensity,
  resetState,
  onExport,
  renderTopToolbarCustomActions,
}: Props<T>) {
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [visibilityAnchor, setVisibilityAnchor] = useState<HTMLElement | null>(null);

  const globalFilter = table.getState().globalFilter;

  const handleExport = (type: ADTExportParams['type']) => {
    setExportAnchor(null);
    if (onExport) {
      onExport({
        type,
        selectionMode: table.getIsSomeRowsSelected() ? 'selected' : 'all',
        sorting: table.getState().sorting,
        columnFilters: table.getState().columnFilters,
        globalFilter: table.getState().globalFilter,
        selectedRowIds: Object.keys(table.getState().rowSelection),
      });
    }
  };

  return (
    <ADTToolbar role='toolbar' aria-label={getAriaLabel('toolbar')}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {title && (
          <Typography variant='h6' component='h1' sx={{ fontWeight: 700, color: 'primary.main' }}>
            {title}
          </Typography>
        )}
        {renderTopToolbarCustomActions?.({ table })}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {enableGlobalFilter && (
          <TextField
            size='small'
            placeholder='Global search...'
            value={globalFilter ?? ''}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search fontSize='small' />
                  </InputAdornment>
                ),
                endAdornment: globalFilter ? (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={() => table.setGlobalFilter('')}>
                      <Clear fontSize='small' />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ width: { xs: 150, md: 250 } }}
          />
        )}

        {enableColumnFilters && (
          <Tooltip title={showFilters ? 'Hide column filters' : 'Show column filters'}>
            <IconButton color={showFilters ? 'primary' : 'default'} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <FilterListOff /> : <FilterList />}
            </IconButton>
          </Tooltip>
        )}

        {enableHiding && (
          <Tooltip title='Column visibility & density'>
            <IconButton onClick={(e) => setVisibilityAnchor(e.currentTarget)}>
              <ViewColumn />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title='Export data'>
          <IconButton onClick={(e) => setExportAnchor(e.currentTarget)}>
            <Download />
          </IconButton>
        </Tooltip>

        <Tooltip title='Reset table state'>
          <IconButton onClick={resetState}>
            <RestartAlt />
          </IconButton>
        </Tooltip>

        {enableFullScreen && (
          <Tooltip title='Toggle full screen'>
            <IconButton onClick={toggleFullScreen}>{isFullScreen ? <FullscreenExit /> : <Fullscreen />}</IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Export Menu */}
      <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <TableRows fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Export as CSV' />
        </MenuItem>
        <MenuItem onClick={() => handleExport('xlsx')}>
          <ListItemIcon>
            <TableRows fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Export as Excel' />
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdf fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Export as PDF' />
        </MenuItem>
      </Menu>

      {/* Visibility & Density Menu */}
      <Menu
        anchorEl={visibilityAnchor}
        open={Boolean(visibilityAnchor)}
        onClose={() => setVisibilityAnchor(null)}
        slotProps={{
          paper: { sx: { width: 280, maxHeight: 500 } },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant='subtitle2' gutterBottom>
            Display Density
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[
              { id: 'compact', icon: <DensitySmall />, label: 'Compact' },
              { id: 'comfortable', icon: <DensityMedium />, label: 'Comfortable' },
              { id: 'spacious', icon: <DensityLarge />, label: 'Spacious' },
            ].map((d) => (
              <Tooltip key={d.id} title={d.label}>
                <IconButton size='small' color={density === d.id ? 'primary' : 'default'} onClick={() => setDensity(d.id as ADTDensity)}>
                  {d.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>
        <Divider />
        <Box sx={{ p: 1 }}>
          <Typography variant='subtitle2' sx={{ px: 1, py: 0.5 }}>
            Table Actions
          </Typography>
          <MenuItem
            onClick={() => {
              setVisibilityAnchor(null);
              import('../utils/autoSizeColumn').then(({ autoSizeAllColumns }) => {
                autoSizeAllColumns(table);
              });
            }}
          >
            <ListItemIcon>
              <ViewColumn fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='Auto-size all columns' />
          </MenuItem>
        </Box>
        <Divider />
        <Box sx={{ p: 1, maxHeight: 300, overflowY: 'auto' }}>
          <Typography variant='subtitle2' sx={{ px: 1, py: 0.5 }}>
            Visible Columns
          </Typography>
          {table.getAllLeafColumns().map((column) => {
            if (column.id.startsWith('__')) return null;
            const headerText = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
            return (
              <MenuItem key={column.id} onClick={() => column.toggleVisibility()} sx={{ py: 0.5 }}>
                <Checkbox size='small' checked={column.getIsVisible()} sx={{ p: 0.5, mr: 1 }} />
                <ListItemText primary={headerText} />
              </MenuItem>
            );
          })}
        </Box>
      </Menu>
    </ADTToolbar>
  );
}

export const AdvancedDataTableToolbar = memo(AdvancedDataTableToolbarInner) as typeof AdvancedDataTableToolbarInner;
