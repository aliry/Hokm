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
    console.log('Game loaded!');
  };

  return (
    <div>
      <button onClick={saveGame}>Save Game</button>
      <button onClick={loadGame}>Load Game</button>
    </div>
  );
};
