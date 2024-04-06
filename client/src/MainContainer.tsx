import React from 'react';
import { useCreateGame, useJoinGame } from './gameState/gameHooks';
import { useAtom } from 'jotai';
import { gameInitStateAtom, gameStateAtom } from './gameState/gameState';

export const MainContainer = () => {
  const [trumpSuit, setTrumpSuit] = React.useState<string>('');

  const [gameState] = useAtom(gameStateAtom);
  const [gameInitState, setGameInitState] = useAtom(gameInitStateAtom);
  const { sessionId, teamCodes } = gameInitState;

  const joinGame = useJoinGame(
    gameInitState.playerName,
    gameInitState.teamCode
  );
  const handleCreateGame = useCreateGame();
  // const handleSelectTrumpSuit = () => {
  //   if (!socket || !trumpSuit) {
  //     return;
  //   }
  //   emitAction(GameAction.SelectTrumpSuit, { trumpSuit });
  // };

  // const setLoadedGameState = (data: {
  //   sessionId: string;
  //   teamCodes: string[];
  //   teamCode: string;
  // }) => {
  //   if (!socketRef.current) {
  //     console.log('Socket is not connected');
  //     return;
  //   }

  //   setSessionId(data.sessionId);
  //   setTeamCodes(data.teamCodes);
  //   setTeamCode(data.teamCode);

  //   joinGame(data.teamCode, playerName);
  // };

  // const handleStartNewRound = () => {
  //   if (!socketRef.current) {
  //     return;
  //   }
  //   emitAction(GameAction.StartNewRound, {});
  // };
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ border: '1px black solid', flex: 0 }}>
        <div style={{ border: '1px black dashed', padding: 5 }}>
          <label>Player Name:</label>
          <input
            type="text"
            value={gameInitState.playerName}
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
            value={gameInitState.teamCode}
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
            {/* <button onClick={handleSelectTrumpSuit}>Select Trump Suit</button> */}
          </div>
        </div>
        <div style={{ border: '1px black dashed', padding: 10 }}>
          {/* <button onClick={handleStartNewRound}>Start New Round</button> */}
        </div>
        {/* <PlayerCardPanel emitAction={emitAction} cards={cards} /> */}
      </div>
      <div style={{ flex: 1 }}>
        {/* <textarea
          rows={40}
          cols={150}
          value={payloads
            .map((p) => JSON.stringify([p], null, 2))
            .join('\n===========\n')}
          style={{ color: 'blue' }}
        />
        <textarea
          rows={10}
          cols={100}
          value={errors
            .map((err) => JSON.stringify(err, null, 2))
            .join('\n===========\n')}
          style={{ color: 'red' }}
        /> */}
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
