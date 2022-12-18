import { useState } from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { Stack } from '@mui/system';
import { ErrorDialog } from './ErrorDialog';
import { ErrorsProps } from './types';

export function Errors({ errors }: ErrorsProps) {
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
