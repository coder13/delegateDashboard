import { type WcifError } from '../../lib/wcif';
import { ErrorDialog } from './ErrorDialog';
import { Alert, AlertTitle, Button } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';

export interface ErrorsProps<T extends object> {
  errors: WcifError<T>[];
}

export function Errors<T extends object>({ errors }: ErrorsProps<T>) {
  const [selectedErrorKey, setSelectedErrorKey] = useState<string | undefined>(undefined);

  return (
    <>
      <Stack spacing={2}>
        {errors.map((err) => (
          <Alert
            severity="error"
            key={err.message}
            action={
              <Button color="error" onClick={() => setSelectedErrorKey(err.key)}>
                Details
              </Button>
            }>
            <AlertTitle>{err.message}</AlertTitle>
          </Alert>
        ))}
      </Stack>

      <ErrorDialog
        error={errors.find((err) => err.key === selectedErrorKey)}
        onClose={() => setSelectedErrorKey(undefined)}
      />
    </>
  );
}
