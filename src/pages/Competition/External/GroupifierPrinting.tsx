import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Container,
  FormControl,
  FormLabel,
  InputLabel,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
} from '@mui/material';
import { useAppSelector } from '../../../store';
import { updateGlobalExtension } from '../../../store/actions';

type ScorecardSize = 'a4' | 'a6' | 'letter';

interface IGroupifierPrintingConfig {
  scorecardPaperSize: ScorecardSize;
  printStations?: boolean;
  printScrambleCheckerForTopRankedCompetitors?: boolean;
  printScrambleCheckerForFinalRounds?: boolean;
  printScrambleCheckerForBlankScorecards?: boolean;
}

export const GroupifierPrintingConfig = () => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const groupifierConfig = wcif?.extensions?.find(
    (extension) => extension.id === 'groupifier.CompetitionConfig'
  )?.data as IGroupifierPrintingConfig | undefined;
  const scorecardPaperSize = groupifierConfig?.scorecardPaperSize;

  const updateScorecardPaperSize = useCallback(
    (event: SelectChangeEvent) => {
      dispatch(
        updateGlobalExtension({
          id: 'groupifier.CompetitionConfig',
          specUrl: 'https://groupifier.jonatanklosko.com/wcif-extensions/CompetitionConfig.json',
          data: {
            ...groupifierConfig,
            scorecardPaperSize: event.target.value as ScorecardSize,
          },
        })
      );
    },
    [dispatch, groupifierConfig]
  );

  const updatePrintStations = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(
        updateGlobalExtension({
          id: 'groupifier.CompetitionConfig',
          specUrl: 'https://groupifier.jonatanklosko.com/wcif-extensions/CompetitionConfig.json',
          data: {
            ...groupifierConfig,
            printStations: event.target.checked,
          },
        })
      );
    },
    [dispatch, groupifierConfig]
  );

  const updatePrintScrambleCheckerForTopRankedCompetitors = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(
        updateGlobalExtension({
          id: 'groupifier.CompetitionConfig',
          specUrl: 'https://groupifier.jonatanklosko.com/wcif-extensions/CompetitionConfig.json',
          data: {
            ...groupifierConfig,
            printScrambleCheckerForTopRankedCompetitors: event.target.checked,
          },
        })
      );
    },
    [dispatch, groupifierConfig]
  );

  const updatePrintScrambleCheckerForFinalRounds = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(
        updateGlobalExtension({
          id: 'groupifier.CompetitionConfig',
          specUrl: 'https://groupifier.jonatanklosko.com/wcif-extensions/CompetitionConfig.json',
          data: {
            ...groupifierConfig,
            printScrambleCheckerForFinalRounds: event.target.checked,
          },
        })
      );
    },
    [dispatch, groupifierConfig]
  );

  const updatePrintScrambleCheckerForBlankScorecards = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(
        updateGlobalExtension({
          id: 'groupifier.CompetitionConfig',
          specUrl: 'https://groupifier.jonatanklosko.com/wcif-extensions/CompetitionConfig.json',
          data: {
            ...groupifierConfig,
            printScrambleCheckerForBlankScorecards: event.target.checked,
          },
        })
      );
    },
    [dispatch, groupifierConfig]
  );

  return (
    <Container maxWidth="md">
      <Stack spacing={1}>
        <h1>Groupifier Printing</h1>
        <div>
          <p>
            This page exists to make changes to the printing portion of groupifier to save clicks.
          </p>
          <Link
            target="_blank"
            href={`https://groupifier.jonatanklosko.com/competitions/${wcif?.id}/printing`}>
            Go to groupifier for printing
          </Link>
        </div>
        <FormControl sx={{ minWidth: 400 }}>
          <InputLabel id="scorecard-size-label">Scorecard size</InputLabel>
          <Select
            label="Scorecard size"
            labelId="scorecard-size-label"
            id="scorecard-size"
            onChange={updateScorecardPaperSize}
            value={scorecardPaperSize}>
            <MenuItem value="a4">A4</MenuItem>
            <MenuItem value="a6">A6</MenuItem>
            <MenuItem value="letter">Letter</MenuItem>
          </Select>
        </FormControl>
        <FormControl margin="none">
          <FormLabel>Print Stations</FormLabel>
          <Switch
            checked={groupifierConfig?.printStations ?? false}
            onChange={updatePrintStations}
          />
        </FormControl>
        <FormControl margin="none">
          <FormLabel>Print Scramble Checker for Top Ranked Competitors</FormLabel>
          <Switch
            checked={groupifierConfig?.printScrambleCheckerForTopRankedCompetitors ?? false}
            onChange={updatePrintScrambleCheckerForTopRankedCompetitors}
          />
        </FormControl>
        <FormControl margin="none">
          <FormLabel>Print Scramble Checker for Final Rounds</FormLabel>
          <Switch
            checked={groupifierConfig?.printScrambleCheckerForFinalRounds ?? false}
            onChange={updatePrintScrambleCheckerForFinalRounds}
          />
        </FormControl>
        <FormControl margin="none">
          <FormLabel>Print Scramble Checker for Blank Scorecards</FormLabel>
          <Switch
            checked={groupifierConfig?.printScrambleCheckerForBlankScorecards ?? false}
            onChange={updatePrintScrambleCheckerForBlankScorecards}
          />
        </FormControl>
      </Stack>
    </Container>
  );
};
