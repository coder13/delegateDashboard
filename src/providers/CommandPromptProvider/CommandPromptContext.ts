import { createContext, useContext } from 'react';

export interface CommandPromptContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const CommandPromptContext = createContext<CommandPromptContextProps>({
  open: false,
  setOpen: () => {},
});

export const useCommandPrompt = () => useContext(CommandPromptContext);
