import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { errorAtom } from '../gameState/gameState';

export const GameAlert = () => {
  const [error] = useAtom(errorAtom)
  const [open, setOpen] = useState(!!error);
  const handleClose = () => {
    console.log('close');
    setOpen(false);
  };

  useEffect(() => {
    setOpen(!!error);
  }, [error]);

  return (
    <Snackbar
      open={open}
      message="Game Over!"
    >
      <Alert
        onClose={handleClose}
        severity="error"
        variant="filled"
        sx={{ width: '100%' }}
      >
        {error}
      </Alert>
    </Snackbar>
  );
}