import axios from 'axios';
import { FC } from 'react';

export interface SaveLoadPanelProps {
  serverURL: string;
  sessionId: string;
  socketId: string;
}

export const SaveLoadPanel: FC<SaveLoadPanelProps> = ({
  serverURL,
  sessionId,
  socketId
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
            playerName: 'Player'
          })
          .then((response) => {
            console.log(response);
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
