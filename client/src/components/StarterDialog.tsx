import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { appStateAtom } from '../gameState/gameState';
import TextField from '@mui/material/TextField';
import { useCreateGame, useJoinGame } from '../gameState/gameHooks';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';

export const StarterDialog = () => {
  const [appState] = useAtom(appStateAtom);
  const [open, setOpen] = useState<boolean>(false);
  const [newTeamCode, setTeamCode] = useState<string>('');
  const { playerName, teamCode } = appState;
  const joinGame = useJoinGame(playerName, teamCode);
  const handleCreateGame = useCreateGame();

  useEffect(() => {
    // open when playerName is set and teamCode is not set
    setOpen(!!playerName && !teamCode);
  }, [playerName, teamCode]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTeamCode(event.target.value);
  };

  const handleJoinGame = () => {
    if (newTeamCode.trim()) {
      joinGame();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="starter-dialog-title"
    >
      <DialogTitle id="starter-dialog-title">Let's start</DialogTitle>
      <DialogContent>
        <DialogContentText>
          If you have a team code, please enter it below and click join.
        </DialogContentText>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            sx={{ flexGrow: 1 }}
            margin="dense"
            id="teamCode"
            label="Team Code"
            type="text"
            value={newTeamCode}
            onChange={handleInputChange}
          />
          <Button onClick={handleJoinGame}>Join</Button>
        </Box>
        <Divider sx={{ m: 3 }} />
        <DialogContentText>
          Otherwise, you can create a new game.
        </DialogContentText>
        <Container sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={handleCreateGame} variant="outlined">
            Create new game
          </Button>
        </Container>
      </DialogContent>
    </Dialog>
  );
};
