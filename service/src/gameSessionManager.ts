import { GameSession } from "./gameSession";

const MAX_CONCURRENT_GAMES = 100;

/**
 * Manages game sessions.
 */
export class GameSessionManager {
  private gameSessions: { [sessionId: string]: GameSession };

  constructor() {
    this.gameSessions = {};
  }

  /**
   * Creates a new game session.
   * @param managerName - The name of the game session manager.
   * @returns The created game session.
   */
  public createGameSession(managerName: string): GameSession {
    if (Object.keys(this.gameSessions).length >= MAX_CONCURRENT_GAMES) {
      throw new Error("Game server reached maximum capacity. Please try again later.");
    }

    const session = new GameSession(managerName);
    this.gameSessions[session.SessionId] = session;
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
    const session = Object.values(this.gameSessions).find(session => session.TeamCodes.includes(teamCode));
    return session;
  }

  /**
    * Retrieves a game session by player ID.
    * @param playerId - The ID of the player.
    * @returns The game session containing the player, or undefined if not found.
    */
  public getGameSessionByPlayerId(playerId: string): GameSession | undefined {
    const session = Object.values(this.gameSessions).find(session => session.Players.some(player => player.id === playerId));
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
    delete this.gameSessions[sessionId];
  }
}
