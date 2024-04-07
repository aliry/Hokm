import { useAtom } from 'jotai';
import { errorAtom, gameStateAtom } from './gameState/gameState';

export const StatePanel = () => {
  const [errorMessage] = useAtom(errorAtom);
  const [gameState] = useAtom(gameStateAtom);

  return (
    <div style={{ flex: 1 }}>
      <textarea
        rows={40}
        cols={150}
        value={JSON.stringify(gameState, null, 2)}
        style={{ color: 'blue' }}
      />
      <textarea
        rows={10}
        cols={100}
        value={errorMessage}
        style={{ color: 'red' }}
      />
    </div>
  );
};
