import React, { memo, useState } from 'react';
import { IconButton, Menu } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

export const RowActionMenu = memo(function RowActionMenu({
  row,
  render,
}: {
  row: any;
  render?: (row: any, close: () => void) => React.ReactNode;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton size='small' onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVert fontSize='small' />
      </IconButton>
      <Menu
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {render?.(row, () => setAnchor(null))}
      </Menu>
    </>
  );
});
