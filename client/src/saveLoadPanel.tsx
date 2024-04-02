import axios from 'axios';
import { FC } from 'react';
import { GameState } from './sharedTypes';

export interface SaveLoadPanelProps {
  serverURL: string;
  sessionId: string;
  socketId: string;
  playerName: string;
  setLoadedGameState: (gameState: GameState) => void;
}

export const SaveLoadPanel: FC<SaveLoadPanelProps> = ({
  serverURL,
  sessionId,
  socketId,
  playerName,
  setLoadedGameState
}) => {
  const downloadString = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.download = 'game-state.hokm';
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  };

  const saveGame = () => {
    axios
      .get(`${serverURL}/game-state`, {
        params: {
          sessionId,
          socketId
        }
      })
      .then((response) => {
        downloadString(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const loadGame = () => {
    if (!playerName) {
      console.log('Player name is required to load game');
      return;
    }

    if (!socketId) {
      console.log('Socket ID is required to load game');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.hokm';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const gameState = e.target?.result as string;
        axios
          .post(`${serverURL}/game-state`, {
            gameState,
            playerName
          })
          .then((response) => {
            console.log(response);
            setLoadedGameState(response.data);
          })
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            document.body.removeChild(fileInput);
          });
      };
      reader.readAsText(file);
    };
    fileInput.click();

    document.body.appendChild(fileInput);
  };

  return (
    <div>
      <button onClick={saveGame}>Save Game</button>
      <button onClick={loadGame}>Load Game</button>
    </div>
  );
};
