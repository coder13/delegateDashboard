import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Container,
  FormControl,
  FormLabel,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  type SelectChangeEvent,
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

  const updateExtension = useCallback(
    (updates: Partial<IGroupifierPrintingConfig>) => {
      dispatch(
        updateGlobalExtension({
          id: 'groupifier.CompetitionConfig',
          specUrl: 'https://groupifier.jonatanklosko.com/wcif-extensions/CompetitionConfig.json',
          data: {
            ...groupifierConfig,
            ...updates,
          },
        })
      );
    },
    [dispatch, groupifierConfig]
  );

  const updateScorecardPaperSize = useCallback(
    (event: SelectChangeEvent) => {
      updateExtension({ scorecardPaperSize: event.target.value as ScorecardSize });
    },
    [updateExtension]
  );

  const updatePrintStations = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateExtension({ printStations: event.target.checked });
    },
    [updateExtension]
  );

  const updatePrintScrambleCheckerForTopRankedCompetitors = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateExtension({ printScrambleCheckerForTopRankedCompetitors: event.target.checked });
    },
    [updateExtension]
  );

  const updatePrintScrambleCheckerForFinalRounds = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateExtension({ printScrambleCheckerForFinalRounds: event.target.checked });
    },
    [updateExtension]
  );

  const updatePrintScrambleCheckerForBlankScorecards = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateExtension({ printScrambleCheckerForBlankScorecards: event.target.checked });
    },
    [updateExtension]
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={8}>
            <FormLabel>Print Stations</FormLabel>
          </Grid>
          <Grid item xs={4}>
            <Switch
              checked={groupifierConfig?.printStations ?? false}
              onChange={updatePrintStations}
            />
          </Grid>
          <Grid item xs={8}>
            <FormLabel>Print Scramble Checker for Top Ranked Competitors</FormLabel>
          </Grid>
          <Grid item xs={4}>
            <Switch
              checked={groupifierConfig?.printScrambleCheckerForTopRankedCompetitors ?? false}
              onChange={updatePrintScrambleCheckerForTopRankedCompetitors}
            />
          </Grid>
          <Grid item xs={8}>
            <FormLabel>Print Scramble Checker for Final Rounds</FormLabel>
          </Grid>
          <Grid item xs={4}>
            <Switch
              checked={groupifierConfig?.printScrambleCheckerForFinalRounds ?? false}
              onChange={updatePrintScrambleCheckerForFinalRounds}
            />
          </Grid>
          <Grid item xs={8}>
            <FormLabel>Print Scramble Checker for Blank Scorecards</FormLabel>
          </Grid>
          <Grid item xs={4}>
            <Switch
              checked={groupifierConfig?.printScrambleCheckerForBlankScorecards ?? false}
              onChange={updatePrintScrambleCheckerForBlankScorecards}
            />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
};
