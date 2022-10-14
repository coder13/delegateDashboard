import { Round } from '@wca/helpers';
import { CheckOutlined } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { GroupGenerator } from '../../lib/groupAssignments/GroupGenerator';
import { getExtensionData } from '../../lib/wcif-extensions';
import { useAppSelector } from '../../store';

interface GroupGeneratorProps extends GroupGenerator {
  enabled: boolean;
  validated: boolean;
}

const GroupGeneratorListItem = ({ id, name, enabled, validated }: GroupGeneratorProps) => {
  return (
    <ListItem key={id}>
      <ListItemIcon>
        <Checkbox checked={enabled} />
      </ListItemIcon>
      <ListItemText primary={name} />
      {!validated ? <Button>Run</Button> : <CheckOutlined />}
    </ListItem>
  );
};

interface GroupGeneratorListProps {
  activityCode: string;
}

export default function GroupsGeneratorList({ activityCode }: GroupGeneratorListProps) {
  const wcif = useAppSelector((state) => state.wcif);
  const event = wcif.events.find((e) => e.id === activityCode.split('-')[0]);
  const round = event?.rounds?.find((r) => r.id === activityCode) as Round;

  const generators = useAppSelector((state) => state.groupGenerators);

  const { generators: configuredGenerators } = getExtensionData('groupGenerators', round);
  console.log(20, configuredGenerators);

  return (
    <Accordion disableGutters square>
      <AccordionSummary>Group Generators</AccordionSummary>
      <AccordionDetails>
        <List dense>
          {configuredGenerators.map(({ id, enabled }) => {
            const generator = generators.find((g) => g.id === id);

            if (!generator) {
              return null;
            }

            return (
              <GroupGeneratorListItem
                key={id}
                {...generator}
                enabled={enabled}
                validated={generator.validate(wcif, activityCode)}
              />
            );
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}
