import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {
  Card,
  GameSessionState,
  GameState,
  PlayerState,
  Round,
  Trick
} from './sharedTypes';
import { CardValues, Suits } from './constants';
import { Player } from './player';
import { GameConfigs } from './gameConfigs';

export type CustomEvents = 'sessionDestroyed';

/**
 * Class representing a game session.
 */
export class GameSession {
  private sessionId: string;
  private teamCodes: string[];
  private players: Player[];
  private manager: Player;
  private deck?: Card[];
  private currentRound?: Round & { tricks: Trick[] };
  private currentRoundNumber: number;
  private scores: { [teamCode: string]: number };
  private currentPlayerIndex?: number;
  private gameStarted: boolean;
  private gameEnded: boolean;
  private roundHistory: Round[];
  private createdDateTime: Date;
  private sessionInactiveTimeout?: NodeJS.Timeout;
  private eventListeners: { [event: string]: Function[] } = {};

  /**
   * Creates a new game session.
   * @param {string} managerName - The name of the game manager for the game session.
   * @returns {GameSession} The newly created game session.
   */
  constructor(managerName: string) {
    this.sessionId = uuidv4(); // Generate a UUID for the session ID
    this.teamCodes = [
      this.generateTeamCode(this.sessionId + 'team1'),
      this.generateTeamCode(this.sessionId + 'team2')
    ];
    this.players = [];
    this.manager = new Player({
      id: '',
      name: managerName,
      teamCode: this.teamCodes[0]
    });
    this.scores = {
      [this.teamCodes[0]]: 0,
      [this.teamCodes[1]]: 0
    };
    this.gameStarted = false;
    this.gameEnded = false;
    this.currentRoundNumber = 0;
    this.roundHistory = [];
    this.createdDateTime = new Date();

    // Automatically destroy the game session after 3s if the manager does not join
    setTimeout(() => {
      if (this.players.length === 0) {
        this.triggerEvent('sessionDestroyed', { sessionId: this.sessionId });
      }
    }, GameConfigs.managerJoinTimeout);

    // Automatically destroy the game session if session is inactive for 10 minutes
    this.SessionHadActivity();
  }

  /**
   * Gets the state of the game session for broadcasting to clients.
   * @param {string} playerId - The ID of the player to get the state for.
   * @returns {GameSessionState} The state of the game session.
   */
  public GetStateForBroadcast(playerId?: string): GameSessionState {
    const state = {
      sessionId: this.sessionId,
      players: this.players.map((player) => player.getState()),
      hakem: this.Hakem?.getState(),
      currentRound: this.currentRound,
      scores: this.scores,
      currentPlayer:
        this.currentPlayerIndex !== undefined
          ? this.players[this.currentPlayerIndex].getState()
          : undefined,
      gameStarted: this.gameStarted,
      gameEnded: this.gameEnded,
      roundHistory: this.roundHistory
    };

    if (playerId) {
      const playerIndex = this.players.findIndex(
        (player) => player.id === playerId
      );
      if (playerIndex !== -1) {
        state.players[playerIndex].cards = this.players[playerIndex].cards;
      }
    }

    return state;
  }

  /**
   * Gets the state of the game session for saving to a file.
   * @returns {GameState} The state of the game session.
   */
  public GetState(): GameState {
    return {
      sessionId: this.sessionId,
      teamCodes: this.teamCodes,
      players: this.players.map((player) => player.getStateWithCards()),
      manager: this.manager.getState(),
      deck: this.deck,
      currentRound: this.currentRound,
      currentRoundNumber: this.currentRoundNumber,
      scores: this.scores,
      currentPlayerIndex: this.currentPlayerIndex,
      gameStarted: this.gameStarted,
      gameEnded: this.gameEnded,
      roundHistory: this.roundHistory,
      createdDateTime: this.createdDateTime.toISOString()
    };
  }

  /**
   * Loads the state of the game session from a file.
   * @param {GameState} state - The state of the game session to load.
   */
  public LoadState(state: GameState): GameSessionState {
    this.sessionId = state.sessionId;
    this.teamCodes = state.teamCodes;
    this.players = state.players.map((playerState) => new Player(playerState));
    this.deck = state.deck;
    this.currentRound = state.currentRound;
    this.currentRoundNumber = state.currentRoundNumber;
    this.scores = state.scores;
    this.currentPlayerIndex = state.currentPlayerIndex;
    this.gameStarted = state.gameStarted;
    this.gameEnded = state.gameEnded;
    this.roundHistory = state.roundHistory;
    this.createdDateTime = new Date(state.createdDateTime);

    this.players.forEach((player) => {
      player.connected = false;
    });

    // Automatically destroy the game session if session is inactive for 10 minutes
    this.SessionHadActivity();

    return this.GetStateForBroadcast();
  }

  /**
   * Retrieves a player by their ID.
   * @param playerId - The ID of the player to retrieve.
   * @returns The player object if found, otherwise undefined.
   */
  public GetPlayerById(playerId: string): Player | undefined {
    return this.players.find((player) => player.id === playerId);
  }

  /**
   * Adds a player to the game session.
   * @param {string} playerName - The name of the player.
   * @param {string} teamCode - The team code of the player.
   * @param {string} socketId - The socket ID of the player.
   * @returns {Player} The player that was added to the game session.
   * @throws {Error} If the player name is not unique or the team has reached its capacity.
   */
  public AddPlayer(
    playerName: string,
    teamCode: string,
    socketId: string
  ): Player {
    // player name should be at least 3 characters and start with a letter
    if (!/^[a-zA-Z].{2,}$/.test(playerName)) {
      throw new Error('Player name must be at least 3 characters long.');
    }

    const isNameUnique = this.players.every(
      (player) => player.name !== playerName && player.id !== socketId
    );
    if (!isNameUnique) {
      throw new Error('Player must be unique.');
    }

    // check of socketId is already in use
    const isSocketIdUnique = this.players.every(
      (player) => player.id !== socketId
    );
    if (!isSocketIdUnique) {
      throw new Error('Player already exists.');
    }

    // First player joining should be the manager
    if (this.Players.length === 0) {
      if (
        this.Manager.name !== playerName ||
        this.Manager.teamCode !== teamCode
      ) {
        throw new Error('Game manager must join the team 1 first.');
      }
      this.Manager.id = socketId;
    }

    const teamPlayerCount = this.players.filter(
      (player) => player.teamCode === teamCode
    ).length;
    if (teamPlayerCount >= 2) {
      throw new Error('Team has reached its capacity.');
    }

    const player = new Player({
      id: socketId,
      name: playerName,
      teamCode
    });
    this.players.push(player);

    return player;
  }

  /**
   * Reconnects a player to the game session.
   * @param playerIndex - The index of the player to reconnect.
   * @param socketId - The new socket ID of the player.
   * @returns The updated player object.
   */
  public ReconnectPlayer(playerIndex: number, socketId: string): Player {
    this.players[playerIndex].id = socketId;
    this.players[playerIndex].connected = true;
    return this.players[playerIndex];
  }

  /**
   * Get the session ID for the game session.
   * @returns {string} The session ID.
   */
  public get SessionId(): string {
    return this.sessionId;
  }

  /**
   * Get the team codes for the game session.
   * @returns {string[]} The team codes.
   */
  public get TeamCodes(): string[] {
    return this.teamCodes;
  }

  /**
   * Get the players in the game session.
   * @returns {string[]} The players.
   */
  public get Players(): Player[] {
    return this.players;
  }

  /**
   * Get the manager of the game session.
   * @returns {Player} The manager.
   */
  public get Manager(): Player {
    return this.manager;
  }

  /**
   * Get the hakem of the game session.
   * @returns {Player | null} The hakem.
   */
  public get Hakem(): Player | undefined {
    if (this.currentRound?.hakemIndex === undefined) {
      return undefined;
    }
    return this.players[this.currentRound.hakemIndex];
  }

  /**
   * Get the deck of cards in the game session.
   * @returns {Card[]} The deck of cards.
   */
  public get Deck(): Card[] | undefined {
    return this.deck;
  }

  /**
   * Get the current round number in the game session.
   * @returns {number} The current round number.
   */
  public get CurrentRound() {
    return this.currentRound;
  }

  /**
   * Get the scores of the teams in the game session.
   * @returns {{ [teamCode: string]: number }} The scores of the teams.
   */
  public get Scores(): { [teamCode: string]: number } {
    return this.scores;
  }

  /**
   * Get the index of the current player in the game session.
   * @returns {number} The index of the current player.
   */
  public get CurrentPlayerIndex(): number | undefined {
    return this.currentPlayerIndex;
  }

  /**
   * Sets the index of the current player.
   * @param index - The index of the current player.
   */
  public set CurrentPlayerIndex(index: number) {
    this.currentPlayerIndex = index;
  }

  /**
   * Check if the game session has started.
   * @returns {boolean} True if the game session has started, false otherwise.
   */
  public get GameStarted(): boolean {
    return this.gameStarted;
  }

  /**
   * Setter for the `GameStarted` property.
   * @param started - A boolean value indicating whether the game has started or not.
   */
  public set GameStarted(started: boolean) {
    this.gameStarted = started;
  }

  /**
   * Check if the game session has ended.
   * @returns {boolean} True if the game session has ended, false otherwise.
   */
  public get GameEnded(): boolean {
    return this.gameEnded;
  }

  /**
   * Get the round history in the game session.
   * @returns {Round[]} The round history.
   */
  public get RoundHistory(): Round[] {
    return this.roundHistory;
  }

  /**
   * Get the date and time when the game session was created.
   * @returns {Date} The date and time when the game session was created.
   */
  public get CreatedDateTime(): Date {
    return this.createdDateTime;
  }

  /**
   * Ends the current round and adds it to the round history.
   */
  public EndRound() {
    if (this.currentRound && this.currentRoundNumber > 0) {
      this.roundHistory.push({
        roundNumber: this.currentRound.roundNumber,
        hakemIndex: this.currentRound.hakemIndex,
        trumpSuit: this.currentRound.trumpSuit,
        score: this.currentRound.score,
        winnerTeam: this.currentRound.winnerTeam
      });
      this.currentRound = undefined;
    }
  }

  /**
   * Starts a new round in the game session.
   */
  public StartNewRound() {
    this.currentRoundNumber++;
    this.currentRound = {
      roundNumber: this.currentRoundNumber,
      tricks: []
    };
  }

  /**
   * Reset the session inactive timeout.
   */
  public SessionHadActivity(): void {
    // If the game session has been inactive for 10 minutes, destroy it
    if (this.sessionInactiveTimeout) {
      clearTimeout(this.sessionInactiveTimeout);
    }
    this.sessionInactiveTimeout = setTimeout(() => {
      this.triggerEvent('sessionDestroyed', { sessionId: this.sessionId });
    }, GameConfigs.sessionInactivityTimeout);
  }

  /**
   * Sets the value of the Hakem property.
   * @param {number} playerIndex - The index of the player to set as the Hakem.
   */
  public SetHakemPlayerIndex(playerIndex: number) {
    if (!this.gameStarted) {
      throw new Error('Game has not started yet.');
    }
    if (this.gameEnded) {
      throw new Error('Game has already ended.');
    }
    if (!this.currentRound) {
      throw new Error('Round has not started yet.');
    }
    if (this.currentRound?.hakemIndex !== undefined) {
      throw new Error('Hakem has already been set for the round.');
    }
    if (playerIndex < 0 || playerIndex >= this.players.length) {
      throw new Error('Invalid player');
    }
    this.currentRound.hakemIndex = playerIndex;
    this.currentPlayerIndex = playerIndex;
    this.deck = this.generateShuffledDeck();
  }

  /**
   * Sets the value of the TrumpSuit property.
   * @param {string | null} trumpSuit - The new value for the TrumpSuit property.
   */
  public set TrumpSuit(trumpSuit: string) {
    if (this.currentRound?.hakemIndex === undefined) {
      throw new Error('Hakem has not been set for the round.');
    }
    if (this.currentRound?.trumpSuit) {
      throw new Error('Trump suit has already been set.');
    }
    this.currentRound.trumpSuit = trumpSuit;
  }

  /**
   * Gets the trump suit of the current round.
   * @returns The trump suit as a string, or undefined if there is no current round.
   */
  public get TrumpSuit(): string | undefined {
    return this.currentRound?.trumpSuit;
  }

  /**
   * Checks if there is a winner for the current round based on the number of tricks won by the hakem and the other team.
   * @returns {boolean} - Returns true if there is a winner, false otherwise.
   * @throws {Error} - Throws an error if the current round or the hakem index is invalid.
   */
  public CheckIfRoundHasWinnerSoFar() {
    if (!this.currentRound || !this.currentRound.hakemIndex) {
      throw new Error('Invalid round operation.');
    }

    const hakem = this.players[this.currentRound.hakemIndex];
    let hakemTricks = 0;
    let otherTeamTricks = 0;
    this.currentRound.tricks.forEach((trick) => {
      if (trick.winnerIndex === this.currentRound?.hakemIndex) {
        hakemTricks++;
      } else {
        otherTeamTricks++;
      }
    });

    const maxTricks = Math.abs(52 / this.players.length);

    if (
      this.currentRound.tricks.length < maxTricks &&
      (hakemTricks === 0 || otherTeamTricks === 0)
    ) {
      // if round is not ended (less than 13 tricks) and one of the teams has not won any tricks, there is a chance for the other team to win all tricks (Kap or Kot)
      return false;
    }

    const otherTeamCode =
      hakem.teamCode === this.teamCodes[0]
        ? this.teamCodes[1]
        : this.teamCodes[0];

    if (hakemTricks === maxTricks) {
      this.scores[hakem.teamCode] += GameConfigs.kotScore;
      this.currentRound.winnerTeam = hakem.teamCode;
      return true;
    }

    if (otherTeamTricks === maxTricks) {
      this.scores[hakem.teamCode] += GameConfigs.hakemKotScore;
      this.currentRound.winnerTeam = otherTeamCode;
      return true;
    }

    if (hakemTricks >= 7) {
      this.scores[hakem.teamCode] += 1;
      this.currentRound.winnerTeam = hakem.teamCode;
      return true;
    }

    if (otherTeamTricks >= 7) {
      this.scores[hakem.teamCode] += 1;
      this.currentRound.winnerTeam = otherTeamCode;
      return true;
    }

    return false;
  }

  //#region Event Handling
  /**
   * Registers a new event listener for the game session.
   * @param {string} event - The event to listen for.
   * @param {Function} listener - The event listener function.
   */
  public on(event: CustomEvents, listener: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  /**
   * Removes an event listener from the game session.
   * @param {string} event - The event to remove the listener from.
   * @param {Function} listener - The event listener function to remove.
   */
  public off(event: CustomEvents, listener: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (l) => l !== listener
      );
    }
  }

  /**
   * Removes all event listeners from the game session.
   */
  public removeAllListeners() {
    this.eventListeners = {};
  }
  //#endregion

  /**
   * Trigger an event to all registered event listeners.
   * @param {string} event - The event to trigger.
   * @param {any} data - The data to pass to the event listeners.
   */
  private triggerEvent(event: CustomEvents, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((listener) => listener(data));
    }
  }

  /**
   * Generate a unique 6-digit alphanumeric code based on a UUID seed.
   * @param {string} uuidSeed - The UUID seed used to generate the code.
   * @returns {string} The generated unique code.
   */
  private generateTeamCode(uuidSeed: string): string {
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
   * Generates a standard deck of playing cards.
   * Shuffles a deck of cards using the Fisher-Yates algorithm.
   * @returns {Array<{ suit: string, value: string }>} The generated deck of cards.
   */
  private generateShuffledDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of Suits) {
      for (const value of CardValues) {
        deck.push({ suit, value });
      }
    }

    // Shuffle the deck using the Fisher-Yates algorithm
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }
}
