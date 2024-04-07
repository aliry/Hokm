import { useAtom } from 'jotai';
import {
  useCreateGame,
  useJoinGame,
  useSetTrumpSuit,
  useStartNewRound
} from './gameState/gameHooks';
import { gameInitStateAtom, trumpSuitAtom } from './gameState/gameState';
import { useState } from 'react';

export const SidePanel = () => {
  const [trumpSuiteFromState] = useAtom(trumpSuitAtom);
  const [trumpSuit, setTrumpSuit] = useState<string>(trumpSuiteFromState);
  const [gameInitState, setGameInitState] = useAtom(gameInitStateAtom);
  const { playerName, teamCode } = gameInitState;
  const joinGame = useJoinGame(playerName, teamCode);
  const handleCreateGame = useCreateGame();
  const selectTrumpSuit = useSetTrumpSuit();
  const handleStartNewRound = useStartNewRound();

  return (
    <div style={{ border: '1px black solid', flex: 0 }}>
      <div style={{ border: '1px black dashed', padding: 5 }}>
        <label>Player Name:</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) =>
            setGameInitState({ ...gameInitState, playerName: e.target.value })
          }
        />
      </div>
      <div style={{ border: '1px black dashed', padding: 5 }}>
        <button
          style={{
            padding: 15,
            margin: 5,
            color: 'darkGreen',
            fontWeight: 'bold'
          }}
          onClick={handleCreateGame}
        >
          Create Game
        </button>
      </div>
      <div style={{ border: '1px black dashed', padding: 5 }}>
        <label>Team Code:</label>
        <input
          type="text"
          value={teamCode}
          onChange={(e) =>
            setGameInitState({ ...gameInitState, teamCode: e.target.value })
          }
        />
        <div>
          <button
            style={{ padding: 10, margin: 5, color: 'green' }}
            onClick={() => joinGame()}
          >
            Join Game
          </button>
        </div>
      </div>
      <div style={{ border: '1px black dashed', padding: 5 }}>
        <label>Trump Suit:</label>
        <input
          type="text"
          value={trumpSuit}
          readOnly={!!trumpSuiteFromState}
          onChange={(e) => setTrumpSuit(e.target.value)}
        />
        <div>
          <button
            disabled={!!trumpSuiteFromState}
            onClick={() => selectTrumpSuit(trumpSuit)}
          >
            Select Trump Suit
          </button>
        </div>
      </div>
      <div style={{ border: '1px black dashed', padding: 10 }}>
        <button onClick={handleStartNewRound}>Start New Round</button>
      </div>{' '}
    </div>
  );
};
