import { CommandPromptDialog } from '../../components/CommandPromptDialog/CommandPromptDialog';
import { useAuth } from '../AuthProvider';
import { CommandPromptContext } from './CommandPromptContext';
import { useCallback, useEffect, useState } from 'react';

export default function CommandPromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!user) {
        return;
      }

      if (e.ctrlKey && e.key === 'p') {
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
      {user && open && <CommandPromptDialog open={open} onClose={() => setOpen(false)} />}
    </CommandPromptContext.Provider>
  );
}
