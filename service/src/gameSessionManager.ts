import { GameSession } from './gameSession';
import { DecryptGameState, EncryptGameSession } from './gameSessionIO';
import { GameState } from './sharedTypes';

const MAX_CONCURRENT_GAMES = 100;

export class GameSessionManager {
  private gameSessions: { [sessionId: string]: GameSession };
  private sessionTimeoutListeners?: (sessionId: string) => void;

  constructor() {
    this.gameSessions = {};
  }

  /**
   * Creates a new game session.
   * @param managerName - The name of the game session manager.
   * @returns The created game session.
   */
  public createGameSession(managerName: string): GameSession {
    this.checkServerCapacity();
    const session = new GameSession(managerName);
    this.gameSessions[session.SessionId] = session;
    this.registerEvents(session);

    return session;
  }

  /**
   * Retrieves a game session by its session ID.
   * @param sessionId - The ID of the game session.
   * @returns The game session with the specified ID, or undefined if not found.
   */
  public getGameSession(sessionId: string): GameSession | undefined {
    return this.gameSessions[sessionId];
  }

  /**
   * Retrieves a game session by its team code.
   * @param teamCode - The team code of the game session.
   * @returns The game session with the specified team code, or undefined if not found.
   */
  public getGameSessionByTeamCode(teamCode: string): GameSession | undefined {
    const session = Object.values(this.gameSessions).find((session) =>
      session.TeamCodes.includes(teamCode)
    );
    return session;
  }

  /**
   * Retrieves a game session by player ID.
   * @param playerId - The ID of the player.
   * @returns The game session containing the player, or undefined if not found.
   */
  public getGameSessionByPlayerId(playerId: string): GameSession | undefined {
    const session = Object.values(this.gameSessions).find((session) =>
      session.Players.some((player) => player.id === playerId)
    );
    return session;
  }

  /**
   * Retrieves all game sessions.
   * @returns An array of all game sessions.
   */
  public getAllGameSessions(): GameSession[] {
    return Object.values(this.gameSessions);
  }

  /**
   * Removes a game session by its session ID.
   * @param sessionId - The ID of the game session to remove.
   */
  public removeGameSession(sessionId: string): void {
    if (!this.gameSessions[sessionId]) {
      return;
    }
    this.gameSessions[sessionId].removeAllListeners();
    delete this.gameSessions[sessionId];
  }

  public encryptGameState(sessionId: string, socketId: string) {
    const session = this.gameSessions[sessionId];
    if (!session) {
      throw new Error('Game session not found');
    }

    const playerName = session.Players.find(
      (player) => player.id === socketId
    )?.name;
    if (!playerName) {
      throw new Error('Player not found');
    }

    const currentGameState = session.GetState();

    // check if we are not in middle of a trick
    if (session.IsATrickInProcess()) {
      throw new Error('Cannot save game state in middle of a trick');
    }

    // Encrypt the game state using the player's name as the password.
    const encryptedGameState = EncryptGameSession(currentGameState, playerName);

    return encryptedGameState;
  }

  public decryptAndLoadGameState(
    encryptedGameState: string,
    playerName: string
  ): GameSession {
    // Decrypt the game state using the player's name as the password.
    const gameState = DecryptGameState(encryptedGameState, playerName);

    // Player loading the game state becomes the manager.
    const session = this.createGameSessionByState(playerName, gameState);

    return session;
  }

  public registerSessionTimeoutListener(listener: (sessionId: string) => void) {
    this.sessionTimeoutListeners = listener;
  }


  private createGameSessionByState(
    playerName: string,
    state: GameState
  ): GameSession {
    this.checkServerCapacity();
    const session = new GameSession(playerName);
    session.LoadState(state);
    this.gameSessions[session.SessionId] = session;
    this.registerEvents(session);

    return session;
  }

  private checkServerCapacity() {
    if (Object.keys(this.gameSessions).length >= MAX_CONCURRENT_GAMES) {
      throw new Error(
        'Game server reached maximum capacity. Please try again later.'
      );
    }
  }

  private registerEvents(session: GameSession) {
    session.on('sessionDestroyed', () => {
      this.sessionTimeoutListeners?.(session.SessionId);
      this.removeGameSession(session.SessionId);
    });
  }
}
