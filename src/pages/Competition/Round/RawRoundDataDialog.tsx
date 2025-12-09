import { useAppSelector } from '../../../store';
import { updateRound } from '../../../store/actions';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { type ActivityCode, parseActivityCode } from '@wca/helpers';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

interface RawRoundDataDialogProps extends DialogProps {
  onClose: () => void;
  roundId: ActivityCode;
}

export const RawRoundDataDialog = ({ roundId, onClose, ...props }: RawRoundDataDialogProps) => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useDispatch();

  const [rawRoundData, setRawRoundData] = useState<string>('');

  useEffect(() => {
    const { eventId } = parseActivityCode(roundId);
    const event = wcif?.events.find((e) => e.id === eventId);
    const round = event?.rounds.find((r) => r.id === roundId);
    setRawRoundData(JSON.stringify(round, null, 2));
  }, [wcif, roundId]);

  const handleSave = () => {
    const parsedJson = JSON.parse(rawRoundData);
    dispatch(updateRound(roundId, parsedJson));
    onClose();
  };

  const lines = rawRoundData.split('\n').length * 2;

  return (
    <Dialog onClose={onClose} {...props} maxWidth="lg" fullWidth>
      <DialogTitle>Raw Data for {roundId}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="warning">Only use this dialog if you know what you are doing!</Alert>
          <TextField
            fullWidth
            id="filled-multiline-flexible"
            label="Multiline"
            multiline
            value={rawRoundData}
            onChange={(e) => setRawRoundData(e.target.value)}
            maxRows={lines}
            variant="filled"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};
