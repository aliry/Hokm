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
 * @returns {GameSession} The newly created game session.
 */
export function createNewSession(managerId: string): GameSession {
  const sessionId = uuidv4();
  const teamCode1 = generateUniqueCode(sessionId + 'team1');
  const teamCode2 = generateUniqueCode(sessionId + 'team2');
  const newSession: GameSession = {
    sessionId,
    teamCodes: [teamCode1, teamCode2],
    players: [{ id: managerId, teamCode: '' }], // Manager joins without a team code initially
    hakem: null
  };
  return newSession;
}
