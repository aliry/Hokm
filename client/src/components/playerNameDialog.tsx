import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { appStateAtom } from '../gameState/gameState';

export const PlayerNameDialog = () => {
  const [appState, setAppState] = useAtom(appStateAtom);
  const [open, setOpen] = useState<boolean>(!appState.playerName);
  const [playerName, setPlayerName] = useState<string>('');

  const handleClose = () => {
    if (playerName.trim()) {
      setAppState((prev) => ({ ...prev, playerName }));
      setOpen(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(event.target.value);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="playerName-dialog-title"
    >
      <DialogTitle id="playerName-dialog-title">Enter Player Name</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To start playing, please enter your name.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Player Name"
          type="text"
          fullWidth
          value={playerName}
          onChange={handleInputChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
