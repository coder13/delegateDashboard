import { MoreVert } from "@mui/icons-material";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useState } from "react";

interface Item {
  label: string;
  onClick: () => void;
}

interface ActionMenuProps {
  items: Item[]
}

export default function ActionMenu({items}: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVert />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {items.map((item) => (
          <MenuItem key={item.label} onClick={() => {
            item.onClick();
            handleClose()
          }}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}