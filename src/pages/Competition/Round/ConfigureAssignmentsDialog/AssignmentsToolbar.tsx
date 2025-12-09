import AssignmentPicker from '../../../../components/AssignmentPicker';
import type { AssignmentsToolbarProps } from './types';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Switch,
  Toolbar,
} from '@mui/material';
import { memo, useState } from 'react';

const AssignmentsToolbar = memo(
  ({
    paintingAssignmentCode,
    setPaintingAssignmentCode,
    competitorSort,
    setCompetitorSort,
    showAllCompetitors,
    setShowAllCompetitors,
    showCompetitorsNotInRound,
    setShowCompetitorsNotInRound,
    onResetAssignments,
  }: AssignmentsToolbarProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(e.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    return (
      <Toolbar
        className="flex-row"
        sx={(theme) => ({
          padding: theme.spacing(2),
          justifyContent: 'space-between',
        })}>
        <div
          className="flex-grow"
          style={{ display: 'flex', flexGrow: 1, alignItems: 'flex-start' }}>
          <AssignmentPicker value={paintingAssignmentCode} setValue={setPaintingAssignmentCode} />
        </div>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            justifyContent: 'space-around',
          }}>
          <FormControl margin="none">
            <FormLabel>Sort</FormLabel>
            <RadioGroup
              row
              value={competitorSort}
              onChange={(e) => setCompetitorSort(e.target.value as 'speed' | 'name')}>
              <FormControlLabel value="speed" control={<Radio />} label="Speed" />
              <FormControlLabel value="name" control={<Radio />} label="Name" />
            </RadioGroup>
          </FormControl>
          <FormControl margin="none">
            <FormLabel>Show All Competitors</FormLabel>
            <Switch
              checked={showAllCompetitors}
              onChange={(e) => setShowAllCompetitors(e.target.checked)}
            />
          </FormControl>
          <FormControl margin="none">
            <FormLabel>Show Competitors Not In Round</FormLabel>
            <Switch
              checked={showCompetitorsNotInRound}
              onChange={(e) => setShowCompetitorsNotInRound(e.target.checked)}
            />
          </FormControl>
        </div>
        <IconButton onClick={handleMenuOpen} className="flex-shrink">
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="Configure-assignments-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}>
          <MenuItem onClick={onResetAssignments}>Reset Assignments</MenuItem>
        </Menu>
      </Toolbar>
    );
  }
);

AssignmentsToolbar.displayName = 'AssignmentsToolbar';

export default AssignmentsToolbar;
