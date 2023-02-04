import { Round } from '@wca/helpers';
import { useDispatch } from 'react-redux';
import { CheckOutlined } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { GroupGenerator } from '../../lib/groupAssignments/GroupGenerator';
import { getExtensionData } from '../../lib/wcif-extensions';
import { useAppSelector } from '../../store';
import { generateAssignments } from '../../store/actions';

interface GroupGeneratorProps extends GroupGenerator {
  enabled: boolean;
  validated: boolean;
  handleRun: () => void;
}

const GroupGeneratorListItem = ({
  id,
  name,
  description,
  enabled,
  validated,
  handleRun,
}: GroupGeneratorProps) => {
  return (
    <ListItem
      key={id}
      secondaryAction={!validated ? <Button onClick={handleRun}>Run</Button> : <CheckOutlined />}>
      <ListItemAvatar>
        <ListItemIcon>
          <Checkbox checked={enabled} />
        </ListItemIcon>
      </ListItemAvatar>
      <ListItemText primary={name} secondary={description} />
    </ListItem>
  );
};

interface GroupGeneratorListProps {
  activityCode: string;
}

export default function GroupsGeneratorList({ activityCode }: GroupGeneratorListProps) {
  const dispatch = useDispatch();
  const wcif = useAppSelector((state) => state.wcif);
  const event = wcif.events.find((e) => e.id === activityCode.split('-')[0]);
  const round = event?.rounds?.find((r) => r.id === activityCode) as Round;

  const generators = useAppSelector((state) => state.groupGenerators);

  const { generators: configuredGenerators } = getExtensionData('groupGenerators', round);
  console.log(20, configuredGenerators);

  const handleRun = (generator: GroupGenerator) => {
    dispatch(
      generateAssignments(activityCode, {
        groupGenerators: [generator],
      })
    );
  };

  return (
    <Accordion disableGutters square>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>Group Generators</AccordionSummary>
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
                validated={!!generator.initialize(wcif, activityCode)?.validate()}
                handleRun={() => handleRun(generator)}
              />
            );
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}
