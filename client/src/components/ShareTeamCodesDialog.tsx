import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { appStateAtom, gameStateAtom } from '../gameState/gameState';
import { useTeamLinks } from '../hooks/useTeamLinks';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { Button, DialogActions } from '@mui/material';

export const ShareTeamCodesDialog = () => {
  const [appState, setAppState] = useAtom(appStateAtom);
  const [gameState] = useAtom(gameStateAtom);
  const [open, setOpen] = useState<boolean>(false);
  const teamLinks = useTeamLinks();

  useEffect(() => {
    setOpen(appState.showTeamCodeDialog);
  }, [appState.showTeamCodeDialog]);

  const somePlayerHasNotJoined = gameState?.players.some(p => !p.connected);

  const handleClose = () => {
    setAppState((prev) => ({ ...prev, showTeamCodeDialog: false }));
  }

  return (
    <Dialog open={open} aria-labelledby="playerName-dialog-title">
      <DialogTitle id="playerName-dialog-title">Invite Your Friends</DialogTitle>
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
        <Divider sx={{ m: 1 }} />
        <DialogContentText>
          Or, you can simply share the team codes
        </DialogContentText>
        <TextField
          margin="normal"
          id="name"
          label="Your Team Code"
          type="text"
          value={appState.teamCodes[0]}
          onFocus={(e) => e.target.select()}
          InputProps={{
            readOnly: true
          }}
        />
        <TextField
          margin="normal"
          id="name"
          label="Opponent Team Code"
          type="text"
          value={appState.teamCodes[1]}
          onFocus={(e) => e.target.select()}
          InputProps={{
            readOnly: true
          }}
        />
        {somePlayerHasNotJoined && <Box sx={{ color: 'red', mt: 3 }}>
          Waiting for other players to join ...
        </Box>}
      </DialogContent>
      {!somePlayerHasNotJoined && <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>}
    </Dialog>
  );
};
