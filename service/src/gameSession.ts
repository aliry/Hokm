import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { GameSession } from './types';

/**
 * Generate a unique 6-digit alphanumeric code based on a UUID seed
 * @param {string} uuidSeed - The UUID seed used to generate the code.
 * @returns {string} The generated unique code.
 */
function generateUniqueCode(uuidSeed: string): string {
  const hash = crypto.createHash('sha256').update(uuidSeed).digest('hex');
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 6;
  let code = '';

  for (let i = 0; i < length; i++) {
    // Convert a substring of the hash into a number before taking the modulo
    const hashSegment = hash.substring(i * 2, i * 2 + 2);
    const index = parseInt(hashSegment, 16) % characters.length;
    code += characters[index];
  }

  return code;
}

/**
 * Creates a new game session.
 * @param {string} managerId - The ID of the manager joining the session.
 * @param {string} managerName - The name of the game manager for the game session.
 * @returns {GameSession} The newly created game session.
 */
export function createNewSession(
  managerId: string,
  managerName: string
): GameSession {
  const sessionId = uuidv4(); // Generate a UUID for the session ID
  const teamCode1 = generateUniqueCode(sessionId + 'team1');
  const teamCode2 = generateUniqueCode(sessionId + 'team2');
  const newSession: GameSession = {
    sessionId,
    teamCodes: [teamCode1, teamCode2],
    players: [],
    manager: { id: managerId, teamCode: teamCode1, name: managerName },
    hakem: null,
    deck: [],
    currentRound: 0,
    maxRounds: 0,
    scores: {
      [teamCode1]: 0,
      [teamCode2]: 0
    },
    currentPlayerIndex: 0,
    trumpSuit: null,
    gameStarted: false,
    gameEnded: false,
    roundHistory: []
  };
  return newSession;
}
