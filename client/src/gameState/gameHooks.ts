import axios from 'axios';
import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { errorAtom, gameStateAtom } from './gameState';
const serverURL = 'http://localhost:3001';

export const useCreateGame = (playerName: string) => {
  const [, setGameState] = useAtom(gameStateAtom);
  const [, setError] = useAtom(errorAtom);
  const handleCreateGame = useCallback(() => {
    axios
      .post(`${serverURL}/create-game`, { managerName: playerName })
      .then((response) => {
        setGameState({
          sessionId: response.data.sessionId,
          teamCodes: response.data.teamCodes,
          teamCode: response.data.teamCodes[0]
        });
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [playerName, setError, setGameState]);

  return handleCreateGame;
};
