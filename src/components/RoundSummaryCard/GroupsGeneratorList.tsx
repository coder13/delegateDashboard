import { Round } from '@wca/helpers';
import { Checkbox, List, ListItem, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { getExtensionData } from '../../lib/wcif-extensions';
import { useAppSelector } from '../../store';

const subheader = <ListSubheader>Group Generators</ListSubheader>;

interface GroupsGeneratorListProps {
  activityCode: string;
}

export default function GroupsGeneratorList({ activityCode }: GroupsGeneratorListProps) {
  const wcif = useAppSelector((state) => state.wcif);
  const event = wcif.events.find((e) => e.id === activityCode.split('-')[0]);
  const round = event?.rounds?.find((r) => r.id === activityCode) as Round;

  const generators = useAppSelector((state) => state.groupGenerators);

  const { generators: configuredGenerators } = getExtensionData('groupGenerators', round);
  console.log(20, configuredGenerators);

  return (
    <List dense subheader={subheader}>
      {configuredGenerators.map(({ id, enabled }) => {
        const generator = generators.find((g) => g.id === id);

        if (!generator) {
          return null;
        }

        return (
          <ListItem key={id}>
            <ListItemIcon>
              <Checkbox checked={enabled} />
            </ListItemIcon>
            <ListItemText primary={generator?.name} />
          </ListItem>
        );
      })}
    </List>
  );
}
