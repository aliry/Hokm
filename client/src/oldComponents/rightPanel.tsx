import { useAtom } from 'jotai';
import { gameStateAtom, gameInitStateAtom } from '../gameState/gameState';

export const RightPanel = () => {
  const [gameState] = useAtom(gameStateAtom);
  const [gameInitState] = useAtom(gameInitStateAtom);
  const { teamCodes } = gameInitState;

  return (
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
        <input type="text" value={gameState?.sessionId} readOnly />
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
  );
};
