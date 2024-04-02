import { GameState } from './sharedTypes';
import {
  DecryptGameState,
  EncryptGameSession
} from '/Users/ali/repos/Hokm/service/src/gameSessionIO';

function createMockGameState(): GameState {
  return {
    sessionId: 'session-id',
    players: [
      {
        id: 'player-1',
        name: 'Player 1',
        teamCode: 'A',
        cards: [
          { suit: 'hearts', value: '2' },
          { suit: 'hearts', value: '3' },
          { suit: 'hearts', value: '4' },
          { suit: 'hearts', value: '5' },
          { suit: 'hearts', value: '6' },
          { suit: 'hearts', value: '7' },
          { suit: 'hearts', value: '8' },
          { suit: 'hearts', value: '9' },
          { suit: 'hearts', value: '10' },
          { suit: 'hearts', value: 'J' },
          { suit: 'hearts', value: 'Q' },
          { suit: 'hearts', value: 'K' },
          { suit: 'hearts', value: 'A' },
          { suit: 'diamonds', value: '2' },
          { suit: 'diamonds', value: '3' },
          { suit: 'diamonds', value: '4' },
          { suit: 'diamonds', value: '5' },
          { suit: 'diamonds', value: '6' },
          { suit: 'diamonds', value: '7' },
          { suit: 'diamonds', value: '8' },
          { suit: 'diamonds', value: '9' },
          { suit: 'diamonds', value: '10' },
          { suit: 'diamonds', value: 'J' },
          { suit: 'diamonds', value: 'Q' },
          { suit: 'diamonds', value: 'K' },
          { suit: 'diamonds', value: 'A' },
          { suit: 'clubs', value: '2' },
          { suit: 'clubs', value: '3' },
          { suit: 'clubs', value: '4' },
          { suit: 'clubs', value: '5' },
          { suit: 'clubs', value: '6' },
          { suit: 'clubs', value: '7' },
          { suit: 'clubs', value: '8' },
          { suit: 'clubs', value: '9' },
          { suit: 'clubs', value: '10' },
          { suit: 'clubs', value: 'J' },
          { suit: 'clubs', value: 'Q' },
          { suit: 'clubs', value: 'K' },
          { suit: 'clubs', value: 'A' },
          { suit: 'spades', value: '2' },
          { suit: 'spades', value: '3' },
          { suit: 'spades', value: '4' },
          { suit: 'spades', value: '5' }
        ]
      },
      {
        id: 'player-2',
        name: 'Player 2',
        teamCode: 'B',
        cards: [
          { suit: 'hearts', value: '2' },
          { suit: 'hearts', value: '3' },
          { suit: 'hearts', value: '4' },
          { suit: 'hearts', value: '5' },
          { suit: 'hearts', value: '6' },
          { suit: 'hearts', value: '7' },
          { suit: 'hearts', value: '8' },
          { suit: 'hearts', value: '9' },
          { suit: 'hearts', value: '10' },
          { suit: 'hearts', value: 'J' },
          { suit: 'hearts', value: 'Q' },
          { suit: 'hearts', value: 'K' },
          { suit: 'hearts', value: 'A' },
          { suit: 'diamonds', value: '2' },
          { suit: 'diamonds', value: '3' },
          { suit: 'diamonds', value: '4' },
          { suit: 'diamonds', value: '5' },
          { suit: 'diamonds', value: '6' },
          { suit: 'diamonds', value: '7' },
          { suit: 'diamonds', value: '8' },
          { suit: 'diamonds', value: '9' },
          { suit: 'diamonds', value: '10' },
          { suit: 'diamonds', value: 'J' },
          { suit: 'diamonds', value: 'Q' },
          { suit: 'diamonds', value: 'K' },
          { suit: 'diamonds', value: 'A' },
          { suit: 'clubs', value: '2' },
          { suit: 'clubs', value: '3' },
          { suit: 'clubs', value: '4' },
          { suit: 'clubs', value: '5' },
          { suit: 'clubs', value: '6' },
          { suit: 'clubs', value: '7' },
          { suit: 'clubs', value: '8' },
          { suit: 'clubs', value: '9' },
          { suit: 'clubs', value: '10' },
          { suit: 'clubs', value: 'J' },
          { suit: 'clubs', value: 'Q' },
          { suit: 'clubs', value: 'K' },
          { suit: 'clubs', value: 'A' },
          { suit: 'spades', value: '2' },
          { suit: 'spades', value: '3' },
          { suit: 'spades', value: '4' }
        ]
      }
    ],
    hakem: {
      id: 'player-1',
      name: 'Player 1',
      teamCode: 'A'
    },
    currentRound: {
      roundNumber: 1,
      tricks: []
    },
    scores: {
      A: 0,
      B: 0
    },
    currentPlayer: {
      id: 'player-1',
      name: 'Player 1',
      teamCode: 'A'
    },
    gameStarted: true,
    gameEnded: false,
    roundHistory: [],
    teamCodes: ['A', 'B'],
    manager: {
      id: 'player-1',
      name: 'Player 1',
      teamCode: 'A'
    },
    currentRoundNumber: 0,
    createdDateTime: new Date().toISOString()
  };
}

describe('EncryptGameSession', () => {
  it('should encrypt/decrypt the game session correctly', () => {
    const player2Name = 'Player 2';
    const gameState = createMockGameState();

    const encryptedSession = EncryptGameSession(gameState, player2Name);

    // Assert that the encrypted session is not empty
    expect(encryptedSession).toBeTruthy();

    // verify that decryption works
    const decryptedSession = DecryptGameState(encryptedSession, player2Name);
    expect(decryptedSession).toEqual(gameState);
  });
});
