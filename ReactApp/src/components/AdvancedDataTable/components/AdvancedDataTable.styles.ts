import { Box, Paper, styled } from '@mui/material';

export const ADTRoot = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isFullScreen' && prop !== 'layoutMode',
})<{ isFullScreen?: boolean; layoutMode?: 'grid' | 'grid-no-grow' | 'semantic' }>(({ isFullScreen, theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: isFullScreen ? 0 : 12,
  overflow: 'hidden',
  position: isFullScreen ? 'fixed' : 'relative',
  top: isFullScreen ? 0 : 'auto',
  left: isFullScreen ? 0 : 'auto',
  height: isFullScreen ? '100vh' : 'auto',
  zIndex: isFullScreen ? 1300 : 'auto',
  boxShadow: isFullScreen ? 'none' : theme.shadows[4],
  backgroundColor: theme.palette.background.paper,
  '--adt-border-color': theme.palette.divider,
  '--adt-header-bg': theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[50],
}));

export const ADTToolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  borderBottom: `1px solid var(--adt-border-color)`,
  backgroundColor: theme.palette.background.paper,
  minHeight: 56,
}));

export const ADTTableContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isFullScreen',
})<{ isFullScreen?: boolean }>(({ isFullScreen }) => ({
  flexGrow: 1,
  maxHeight: isFullScreen ? 'calc(100vh - 120px)' : 600,
  minHeight: 300,
  position: 'relative',
  overflow: 'auto',
  width: '100%',
  minWidth: 0,
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': {
    width: 8,
    height: 8,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
}));

export const ADTHeaderBar = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  top: 0,
  zIndex: 20,
  width: '100%',
  backgroundColor: 'var(--adt-header-bg)',
}));

export const ADTHeaderRow = styled(Box)(() => ({
  display: 'flex',
  width: '100%',
  borderBottom: `2px solid var(--adt-border-color)`,
}));

export const ADTBody = styled(Box)(() => ({
  display: 'block',
  width: '100%',
  position: 'relative',
}));

export const ADTRowWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isEditing' && prop !== 'isGrouped' && prop !== 'isSelected',
})<{ isEditing?: boolean; isGrouped?: boolean; isSelected?: boolean }>(({ theme, isEditing, isGrouped, isSelected }) => ({
  display: 'flex',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'background-color 0.1s ease',
  backgroundColor: isSelected ? theme.palette.action.selected : theme.palette.background.paper,
  minHeight: 'var(--adt-row-height)',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  ...(isGrouped && {
    backgroundColor: theme.palette.action.hover,
    fontWeight: 'bold',
  }),
  ...(isEditing && {
    backgroundColor: theme.palette.action.selected,
  }),
}));

export const ADTCellWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPinned' && prop !== 'grow' && prop !== 'isEditing' && prop !== 'isResizing',
})<{ isPinned?: boolean; grow?: any; isEditing?: boolean; isResizing?: boolean }>(({ theme, isPinned, grow, isEditing, isResizing }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  boxSizing: 'border-box',
  overflow: 'hidden',
  borderBottom: `1px solid var(--adt-border-color)`,
  borderRight: `1px solid var(--adt-border-color)`,
  backgroundColor: isEditing ? theme.palette.action.hover : 'inherit',
  flex: grow ? `${grow} ${grow} auto` : '0 0 auto',
  zIndex: isPinned ? 10 : 1,
  position: isPinned ? 'sticky' : 'relative',
  padding: 'var(--adt-cell-padding-y) var(--adt-cell-padding-x)',
  minHeight: 'var(--adt-row-height)',
  fontSize: 'var(--adt-font-size)',
  ...(isResizing && {
    borderRight: `2px solid ${theme.palette.primary.main}`,
  }),
}));

export const ADTHeaderCellWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPinned' && prop !== 'grow',
})<{ isPinned?: boolean; grow?: any }>(({ theme, isPinned, grow }) => ({
  position: isPinned ? 'sticky' : 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  boxSizing: 'border-box',
  overflow: 'hidden',
  backgroundColor: 'var(--adt-header-bg)',
  borderRight: `1px solid var(--adt-border-color)`,
  flex: grow ? `${grow} ${grow} auto` : '0 0 auto',
  zIndex: isPinned ? 21 : 1,
  padding: 'var(--adt-cell-padding-y) var(--adt-cell-padding-x)',
  fontWeight: 600,
  userSelect: 'none',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
  },
}));

export const ADTResizeHandle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isResizing',
})<{ isResizing?: boolean }>(({ theme, isResizing }) => ({
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: 10,
  cursor: 'col-resize',
  zIndex: 100,
  pointerEvents: 'auto',
  backgroundColor: 'transparent',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    width: 2,
    backgroundColor: isResizing ? theme.palette.primary.main : 'transparent',
    transition: 'background-color 0.2s',
  },
  '&:hover::after': {
    backgroundColor: theme.palette.primary.main,
  },
}));

export const ADTFooter = styled(Box)(({ theme }) => ({
  borderTop: `1px solid var(--adt-border-color)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.5, 2),
  backgroundColor: theme.palette.background.paper,
  minHeight: 48,
}));

export const ADTLoadingOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(2px)',
  zIndex: 100,
}));
