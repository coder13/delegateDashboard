import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Dialog,
  DialogContent,
  Divider,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from '@mui/material';
import { searchPersons } from '../../../lib/wcaAPI';

export default function CheckFirstTimerDialog({ open, onClose, person }) {
  const [personSearch, setPersonSearch] = useState(null);
  const [loadingPersonSearch, setLoadingPersonSearch] = useState(false);

  const fetchPersonDetails = useCallback(
    async (registrantId) => {
      setLoadingPersonSearch(true);
      const data = await searchPersons(person.name);
      setPersonSearch(data);
      setLoadingPersonSearch(false);
    },
    [person]
  );

  useEffect(() => {
    if (person?.registrantId) {
      fetchPersonDetails(person.registrantId);
    }
  }, [fetchPersonDetails, person]);

  console.log(personSearch);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <AppBar sx={{ position: 'relative' }} color="inherit">
        <Toolbar>
          <Avatar
            edge="start"
            color="inherit"
            src={person?.avatar?.thumbUrl || person?.avatar?.url || ''}
          />
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {person?.name}
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent style={{ paddingTop: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Birthdate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{person?.countryIso2}</TableCell>
              <TableCell>{person?.email}</TableCell>
              <TableCell>{person?.gender}</TableCell>
              <TableCell>{person?.birthdate}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Divider />
        {loadingPersonSearch && <LinearProgress />}
        <List>
          {personSearch?.map(({ person: p, competition_count }) => (
            <ListItemButton key={p.id} component="a" to={p.url} target="_blank">
              <ListItemIcon>
                <Avatar src={p.avatar.thumb_url} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <>
                    {p.name} ({p.wca_id})
                  </>
                }
                secondary={`${p.country.name}  -  ${p.email}  -  ${p.gender} - ${competition_count} competitions`}
              />
            </ListItemButton>
          ))}
        </List>
        {!loadingPersonSearch && personSearch?.length === 0 && (
          <Alert severity="success">No Matches found.</Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
