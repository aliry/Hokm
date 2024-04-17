import { FC } from 'react';
import { useLoadGame, useSaveGame } from '../gameState/gameHooks';

export const SaveLoadPanel: FC = () => {
  const saveGame = useSaveGame();
  const loadGame = useLoadGame();

  return (
    <div>
      <button onClick={saveGame}>Save Game</button>
      <button onClick={() => loadGame()}>Load Game</button>
    </div>
  );
};
