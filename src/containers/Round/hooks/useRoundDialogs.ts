import { type Person } from '@wca/helpers';
import { useState } from 'react';

interface PersonsDialogState {
  open: boolean;
  title?: string;
  persons: Person[];
}

type DialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

interface UseRoundDialogsResult {
  configureAssignments: DialogState;
  configureGroupCounts: DialogState;
  configureGroups: DialogState;
  configureStationNumbers: {
    activityCode: string | false;
    setActivityCode: (activityCode: string | false) => void;
  };
  rawRoundData: DialogState;
  rawRoundActivitiesData: DialogState;
  personsDialog: {
    state: PersonsDialogState;
    open: (title: string, persons: Person[]) => void;
    close: () => void;
  };
  personsAssignments: DialogState;
}

export const useRoundDialogs = (): UseRoundDialogsResult => {
  const [configureAssignmentsOpen, setConfigureAssignmentsOpen] = useState(false);
  const [configureGroupCountsOpen, setConfigureGroupCountsOpen] = useState(false);
  const [configureGroupsOpen, setConfigureGroupsOpen] = useState(false);
  const [configureStationNumbersActivityCode, setConfigureStationNumbersActivityCode] = useState<
    string | false
  >(false);
  const [rawRoundDataOpen, setRawRoundDataOpen] = useState(false);
  const [rawRoundActivitiesDataOpen, setRawRoundActivitiesDataOpen] = useState(false);
  const [personsDialogState, setPersonsDialogState] = useState<PersonsDialogState>({
    open: false,
    title: undefined,
    persons: [],
  });
  const [personsAssignmentsOpen, setPersonsAssignmentsOpen] = useState(false);

  return {
    configureAssignments: {
      open: configureAssignmentsOpen,
      setOpen: setConfigureAssignmentsOpen,
    },
    configureGroupCounts: {
      open: configureGroupCountsOpen,
      setOpen: setConfigureGroupCountsOpen,
    },
    configureGroups: {
      open: configureGroupsOpen,
      setOpen: setConfigureGroupsOpen,
    },
    configureStationNumbers: {
      activityCode: configureStationNumbersActivityCode,
      setActivityCode: setConfigureStationNumbersActivityCode,
    },
    rawRoundData: {
      open: rawRoundDataOpen,
      setOpen: setRawRoundDataOpen,
    },
    rawRoundActivitiesData: {
      open: rawRoundActivitiesDataOpen,
      setOpen: setRawRoundActivitiesDataOpen,
    },
    personsDialog: {
      state: personsDialogState,
      open: (title: string, persons: Person[]) => {
        setPersonsDialogState({ open: true, title, persons });
      },
      close: () => {
        setPersonsDialogState({ open: false, title: undefined, persons: [] });
      },
    },
    personsAssignments: {
      open: personsAssignmentsOpen,
      setOpen: setPersonsAssignmentsOpen,
    },
  };
};
