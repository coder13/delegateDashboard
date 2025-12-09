import { findRooms } from '../../../lib/domain/activities';
import { useAppSelector } from '../../../store';
import { updateRoundActivities } from '../../../store/actions';
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
  Typography,
} from '@mui/material';
import { type Activity, type ActivityCode } from '@wca/helpers';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

interface RawRoundActivitiesDataDialogProps extends DialogProps {
  onClose: () => void;
  activityCode: ActivityCode;
}

export const RawRoundActivitiesDataDialog = ({
  activityCode,
  onClose,
  ...props
}: RawRoundActivitiesDataDialogProps) => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useDispatch();

  const [rawRoundActivitiesData, setRawRoundActivitiesData] = useState<Record<number, string>>({});

  const rooms = useMemo(
    () =>
      wcif &&
      findRooms(wcif).filter((room) =>
        room.activities.some((ra) => ra.activityCode === activityCode)
      ),
    [wcif, activityCode]
  );

  const roundActivities = useMemo(
    () =>
      rooms?.flatMap((room) => room.activities.filter((ra) => ra.activityCode === activityCode)),
    [rooms, activityCode]
  );

  useEffect(() => {
    if (!roundActivities) {
      return;
    }

    setRawRoundActivitiesData(
      roundActivities?.reduce(
        (acc, ra) => ({
          ...acc,
          [ra.id]: JSON.stringify(ra, null, 2),
        }),
        {}
      )
    );
  }, [roundActivities]);

  const handleSave = () => {
    const parsedJson = Object.keys(rawRoundActivitiesData).map((id) =>
      JSON.parse(rawRoundActivitiesData[+id])
    ) as Activity[];
    dispatch(updateRoundActivities(parsedJson));
    onClose();
  };

  return (
    <Dialog onClose={onClose} {...props} maxWidth="lg" fullWidth>
      <DialogTitle>Raw Data for {activityCode}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="warning">Only use this dialog if you know what you are doing!</Alert>

          {Object.keys(rawRoundActivitiesData).map((id) => (
            <Fragment key={id}>
              <Typography>
                {id} ({rooms?.find((room) => room.activities.some((ra) => ra.id === +id))?.name})
              </Typography>
              <TextField
                fullWidth
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                value={rawRoundActivitiesData[id as unknown as keyof typeof rawRoundActivitiesData]}
                onChange={(e) =>
                  setRawRoundActivitiesData((prev) => ({
                    ...prev,
                    [id]: e.target.value,
                  }))
                }
                maxRows={
                  rawRoundActivitiesData[
                    id as unknown as keyof typeof rawRoundActivitiesData
                  ].split('\n').length
                }
                variant="filled"
              />
            </Fragment>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};
