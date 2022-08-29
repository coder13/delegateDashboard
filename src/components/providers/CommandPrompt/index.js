import { useEffect, useState } from 'react';
import CommandPromptDialog from './CommandPromptDialog';

export default function CommandPromptProvider({ children }) {
  const [open, setOpen] = useState(true);

  const handleKeyDown = (e) => {
    console.log(e.key);
    if (e.ctrlKey & (e.key === 'p')) {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  return (
    <>
      {children}
      <CommandPromptDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
