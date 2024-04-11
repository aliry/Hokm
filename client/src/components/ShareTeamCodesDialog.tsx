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
import { useTeamLinks } from '../hooks/useTeamLinks';

export const ShareTeamCodesDialog = () => {
  const [appState] = useAtom(appStateAtom);
  const [open, setOpen] = useState<boolean>(true);
  const teamLinks = useTeamLinks();

  const handleClose = () => {
    setOpen(false);
  };

  if (appState.teamCodes.length !== 2) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="playerName-dialog-title"
    >
      <DialogTitle id="playerName-dialog-title">Links</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Share these links with your friends to start playing.
        </DialogContentText>
        <TextField
          margin="dense"
          id="name"
          label="Your Team Link"
          type="text"
          fullWidth
          value={teamLinks.myTeamLink}
          InputProps={{
            readOnly: true
          }}
        />
        <TextField
          margin="dense"
          id="name"
          label="Opponent Team Link"
          type="text"
          fullWidth
          value={teamLinks.opponentTeamLink}
          InputProps={{
            readOnly: true
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
