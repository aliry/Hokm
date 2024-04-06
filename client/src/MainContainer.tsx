import React from 'react';
import {
  useCreateGame,
  useJoinGame,
  useSetTrumpSuit,
  useStartNewRound
} from './gameState/gameHooks';
import { useAtom } from 'jotai';
import {
  errorAtom,
  gameInitStateAtom,
  gameStateAtom
} from './gameState/gameState';
import { PlayerCardPanel } from './components/PlayerCardPanel';

export const MainContainer = () => {
  const [trumpSuit, setTrumpSuit] = React.useState<string>('');
  const [errorMessage] = useAtom(errorAtom);
  const [gameState] = useAtom(gameStateAtom);
  const [gameInitState, setGameInitState] = useAtom(gameInitStateAtom);
  const { sessionId, teamCodes, playerName, teamCode } = gameInitState;

  const joinGame = useJoinGame(playerName, teamCode);
  const handleCreateGame = useCreateGame();
  const selectTrumpSuit = useSetTrumpSuit();
  const handleStartNewRound = useStartNewRound();

  return (
    <div style={{ display: 'flex', gap: 10 }}>
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
            onChange={(e) => setTrumpSuit(e.target.value)}
          />
          <div>
            <button onClick={() => selectTrumpSuit(trumpSuit)}>
              Select Trump Suit
            </button>
          </div>
        </div>
        <div style={{ border: '1px black dashed', padding: 10 }}>
          <button onClick={handleStartNewRound}>Start New Round</button>
        </div>
        <PlayerCardPanel />
      </div>
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
        {/* <SaveLoadPanel
          serverURL={serverURL}
          sessionId={sessionId || gameState?.sessionId || ''}
          socketId={socketRef.current?.id || ''}
          playerName={playerName}
          setLoadedGameState={setLoadedGameState}
        /> */}
      </div>
      <div style={{ flex: 1 }}>
        {teamCodes?.length === 2 && (
          <div>
            <div>
              <label>Team 1:</label>
              <input type="text" value={teamCodes[0]} readOnly />
            </div>
            <div>
              <label>Team 2:</label>
              <input type="text" value={teamCodes[1]} readOnly />
            </div>
          </div>
        )}
        <div>
          <label>Session ID:</label>
          <input
            type="text"
            value={sessionId || gameState?.sessionId}
            readOnly
          />
        </div>
        {gameState && (
          <div>
            <div>
              <label>Team Scores:</label>
              {Object.entries(gameState.scores).map(([teamCode, score]) => (
                <div key={teamCode}>
                  <label>
                    {teamCode}: {score}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        {gameState?.currentRound && (
          <div>
            <div style={{ margin: 5, fontWeight: 'bold' }}>
              Current Round States
            </div>
            <div>
              <label>{`Hakem Name: ${
                gameState.currentRound?.hakemIndex
                  ? gameState.players[gameState.currentRound.hakemIndex].name
                  : ' not selected yet'
              }`}</label>
            </div>
            <div>
              <label>{`Trump Suit: ${gameState?.currentRound?.trumpSuit}`}</label>
            </div>
            <div>
              <label>Scores:</label>
              {gameState.currentRound.score &&
                Object.entries(gameState.currentRound.score).map(
                  ([teamCode, score]) => (
                    <div key={teamCode}>
                      <label>
                        {teamCode}: {score}
                      </label>
                    </div>
                  )
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
