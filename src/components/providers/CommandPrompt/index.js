import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import CommandPromptDialog from './CommandPromptDialog';

const CommandPromptContext = createContext({
  open: false,
});

export default function CommandPromptProvider({ children }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const handleKeyDown = useCallback(
    (e) => {
      if (!user) {
        return;
      }

      if (e.ctrlKey & (e.key === 'p')) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, user]);

  return (
    <CommandPromptContext.Provider value={{ open, setOpen }}>
      {children}
      {user && <CommandPromptDialog open={open} onClose={() => setOpen(false)} />}
    </CommandPromptContext.Provider>
  );
}

export const useCommandPrompt = () => useContext(CommandPromptContext);
