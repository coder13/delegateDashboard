import { UpcomingCompetitions } from '../components/CompetitionLists';
import { PastCompetitions } from '../components/CompetitionLists/PastCompetitions';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';

const CompetitionList = () => {
  return (
    <Container>
      <Typography variant="h4">My Competitions</Typography>

      <List>
        <ListSubheader inset disableSticky color="primary">
          Upcoming Competitions
        </ListSubheader>

        <UpcomingCompetitions />

        <Divider />

        <ListSubheader inset disableSticky color="primary">
          Past Competitions
        </ListSubheader>

        <PastCompetitions />
      </List>
    </Container>
  );
};

export default CompetitionList;
