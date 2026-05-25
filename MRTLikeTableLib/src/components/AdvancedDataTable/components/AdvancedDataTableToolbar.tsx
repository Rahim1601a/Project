import React, { useState } from 'react';
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
  CircularProgress,
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
import { autoSizeAllColumns } from '../utils/autoSizeColumn';

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
  onExport?: (params: ADTExportParams) => Promise<void> | void;
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
  const [isExporting, setIsExporting] = useState(false);

  const globalFilter = table.getState().globalFilter;

  const handleExport = async (type: ADTExportParams['type']) => {
    if (isExporting) return;

    setExportAnchor(null);

    if (!onExport) return;

    try {
      setIsExporting(true);

      const selectedRowIds = Object.keys(table.getState().rowSelection);
      const hasSelectedRows = selectedRowIds.length > 0;

      await onExport({
        type,
        selectionMode: hasSelectedRows ? 'selected' : 'all',
        sorting: table.getState().sorting,
        columnFilters: table.getState().columnFilters,
        globalFilter: table.getState().globalFilter,
        selectedRowIds,
      });
    } finally {
      setIsExporting(false);
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
            disabled={isExporting}
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
                    <IconButton size='small' disabled={isExporting} onClick={() => table.setGlobalFilter('')}>
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
            <span>
              <IconButton disabled={isExporting} color={showFilters ? 'primary' : 'default'} onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <FilterListOff /> : <FilterList />}
              </IconButton>
            </span>
          </Tooltip>
        )}

        {enableHiding && (
          <Tooltip title='Column visibility & density'>
            <span>
              <IconButton
                aria-label='View Settings'
                disabled={isExporting}
                onClick={(event) => setVisibilityAnchor(event.currentTarget)}
              >
                <ViewColumn />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Tooltip title={isExporting ? 'Exporting file...' : 'Export data'}>
          <span>
            <IconButton
              aria-label='Export Options'
              disabled={isExporting}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{
                position: 'relative',
              }}
            >
              {isExporting ? <CircularProgress size={22} thickness={5} /> : <Download />}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title='Reset table state'>
          <span>
            <IconButton disabled={isExporting} onClick={resetState}>
              <RestartAlt />
            </IconButton>
          </span>
        </Tooltip>

        {enableFullScreen && (
          <Tooltip title='Toggle full screen'>
            <span>
              <IconButton disabled={isExporting} onClick={toggleFullScreen}>
                {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Export Menu */}
      <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
        <MenuItem disabled={isExporting} onClick={() => handleExport('csv')}>
          <ListItemIcon>{isExporting ? <CircularProgress size={18} /> : <TableRows fontSize='small' />}</ListItemIcon>
          <ListItemText primary={isExporting ? 'Exporting CSV...' : 'Export as CSV'} />
        </MenuItem>

        <MenuItem disabled={isExporting} onClick={() => handleExport('xlsx')}>
          <ListItemIcon>{isExporting ? <CircularProgress size={18} /> : <TableRows fontSize='small' />}</ListItemIcon>
          <ListItemText primary={isExporting ? 'Exporting Excel...' : 'Export as Excel'} />
        </MenuItem>

        <MenuItem disabled={isExporting} onClick={() => handleExport('pdf')}>
          <ListItemIcon>{isExporting ? <CircularProgress size={18} /> : <PictureAsPdf fontSize='small' />}</ListItemIcon>
          <ListItemText primary={isExporting ? 'Exporting PDF...' : 'Export as PDF'} />
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
            ].map((densityOption) => (
              <Tooltip key={densityOption.id} title={densityOption.label}>
                <IconButton
                  size='small'
                  disabled={isExporting}
                  color={density === densityOption.id ? 'primary' : 'default'}
                  onClick={() => setDensity(densityOption.id as ADTDensity)}
                >
                  {densityOption.icon}
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
            disabled={isExporting}
            onClick={() => {
              setVisibilityAnchor(null);
              autoSizeAllColumns(table);
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
              <MenuItem key={column.id} disabled={isExporting} onClick={() => column.toggleVisibility()} sx={{ py: 0.5 }}>
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

export const AdvancedDataTableToolbar = AdvancedDataTableToolbarInner;
