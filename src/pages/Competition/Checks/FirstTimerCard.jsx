import {
  Avatar,
  Card,
  CardHeader,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

export default function FirstTimerCard({ person, matches }) {
  return (
    <Card>
      <CardHeader avatar={<Avatar src={person.avatar?.thumbUrl} />} title={person.name} />
      <Table size="small">
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
      <List dense>
        {matches.map((match) => (
          <PersonMatchRow key={match.person.id} match={match} />
        ))}
      </List>
    </Card>
  );
}

function PersonMatchRow({ match }) {
  return (
    <ListItemButton component="a" target="_blank" to={match.person.url}>
      <ListItemIcon>
        <Avatar src={match.person.avatar.thumb_url} />
      </ListItemIcon>
      <ListItemText
        primary={`${match.person.name} (${match.person.wca_id})`}
        secondary={`${match.person?.country?.name || match.person?.country_iso2}   -  ${
          match.person.gender
        } - ${match.competition_count} competitions`}
      />
    </ListItemButton>
  );
}
