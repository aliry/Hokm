import * as crypto from 'crypto';
import { GameSession } from './gameSession';
import { GameState } from './sharedTypes';

// load environment variables
require('dotenv').config();

const algorithm = 'aes-256-ctr';

// Retrieve the salt from an environment variable
const salt = Buffer.from(
  process.env.GAME_STATE_SALT || crypto.randomBytes(16).toString('hex'),
  'hex'
);

// Retrieve the iv from an environment variable
const iv = Buffer.from(
  process.env.GAME_STATE_IV || crypto.randomBytes(16).toString('hex'),
  'hex'
);

function getKeyFromPassword(password: string): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function encrypt(text: string, key: Buffer): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function decrypt(encryptedText: string, key: Buffer, iv: Buffer): string {
  const encryptedBuffer = Buffer.from(encryptedText, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Encrypts the game session state using a password-based encryption scheme.
 * @param gameState The game state to be encrypted.
 * @returns The encrypted game session as a string.
 */
export function EncryptGameSession(gameState: GameState): string {
  const password = gameState.manager.name;
  const key = getKeyFromPassword(password);
  const gameSessionStr = JSON.stringify(gameState);
  const gameSessionEncrypted = encrypt(gameSessionStr, key);
  return gameSessionEncrypted;
}

/**
 * Decrypts the encrypted game state using the provided password.
 *
 * @param blob - The encrypted game state as a string.
 * @param password - The password used for decryption.
 * @returns The decrypted game state.
 */
export function DecryptGameState(blob: string, password: string): GameState {
  const key = getKeyFromPassword(password);
  const decryptedText = decrypt(blob, key, iv);
  return JSON.parse(decryptedText);
}
