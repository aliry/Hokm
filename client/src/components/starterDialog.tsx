import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { appStateAtom } from '../gameState/gameState';
import { useCreateGame, useJoinGame, useLoadGame } from '../gameState/gameHooks';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

export const StarterDialog = () => {
  const [appState, setAppState] = useAtom(appStateAtom);
  const [open, setOpen] = useState<boolean>(!appState.playerName);
  const [newPlayerName, setPlayerName] = useState<string>('');
  const [newTeamCode, setTeamCode] = useState<string>(appState.teamCode);
  const joinGame = useJoinGame();
  const [joinWithTeamCode, setJoinWithTeamCode] = useState<boolean>(false);
  const createGame = useCreateGame();
  const loadGame = useLoadGame();

  useEffect(() => {
    setOpen(!appState.playerName);
  }, [appState.playerName]);

  useEffect(() => {
    if (appState.teamCode !== '') {
      setJoinWithTeamCode(true);
    }
  }, [appState.teamCode]);

  const handleClose = useCallback(() => {
    if (newPlayerName.trim()) {
      setAppState((prev) => ({ ...prev, playerName: newPlayerName }));
    }
  }, [newPlayerName, setAppState]);

  const handlePlayerNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerName(event.target.value);
    },
    []
  );

  const handleTeamCodeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setTeamCode(event.target.value);
    },
    []
  );

  const handleCreateGame = useCallback(() => {
    if (!newPlayerName.trim()) {
      return;
    }
    createGame(newPlayerName);
    setOpen(false);
  }, [createGame, newPlayerName]);

  const handleJoinGame = useCallback(() => {
    if (newTeamCode.trim() && newPlayerName.trim()) {
      joinGame(newPlayerName, newTeamCode);
      setOpen(false);
    }
  }, [joinGame, newTeamCode, newPlayerName]);

  const handleLoadGame = useCallback(() => {
    setAppState((prev) => ({ ...prev, playerName: newPlayerName }));
    loadGame(newPlayerName)
  }, [loadGame, newPlayerName, setAppState]);

  const dialogTitle = joinWithTeamCode
    ? 'Join an existing game'
    : 'Enter Player Name';

  const getPlayerName = useMemo(
    () => (
      <>
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
          value={newPlayerName}
          onChange={handlePlayerNameChange}
        />
        <Container sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Button
              onClick={handleCreateGame}
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  handleCreateGame();
                }
              }}
              variant="contained"
            >
              Create New Game
            </Button>
            <Button
              onClick={handleLoadGame}
              sx={{ textTransform: 'none' }}
            >
              Load game
            </Button>
          </Box>
        </Container>
      </>
    ),
    [newPlayerName, handlePlayerNameChange, handleCreateGame, handleLoadGame]
  );

  const getTeamCode = useMemo(
    () => (
      <>
        <TextField
          autoFocus
          margin="dense"
          id="playerName"
          label="Player Name"
          type="text"
          fullWidth
          value={newPlayerName}
          onChange={handlePlayerNameChange}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleJoinGame();
            }
          }}
        />
        <TextField
          margin="dense"
          id="teamCode"
          label="Team Code"
          type="text"
          fullWidth
          value={newTeamCode}
          InputProps={{
            disabled: appState.teamCode !== ''
          }}
          onChange={handleTeamCodeChange}
        />
        <Container sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={handleJoinGame} variant="contained">
            Join Game
          </Button>
        </Container>
      </>
    ),
    [
      newPlayerName,
      newTeamCode,
      handlePlayerNameChange,
      handleTeamCodeChange,
      handleJoinGame,
      appState.teamCode
    ]
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="playerName-dialog-title"
    >
      <DialogTitle id="playerName-dialog-title">{dialogTitle}</DialogTitle>
      <DialogContent>
        {joinWithTeamCode ? getTeamCode : getPlayerName}
      </DialogContent>
      {!joinWithTeamCode && (
        <DialogContent>
          <Divider />
          <Button
            onClick={() => setJoinWithTeamCode(true)}
            sx={{ textTransform: 'none' }}
          >
            Join an existing game with team code
          </Button>
        </DialogContent>
      )}
    </Dialog>
  );
};
