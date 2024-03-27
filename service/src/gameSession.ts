import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Card, Player, Round } from './types';

/**
 * Class representing a game session.
 */
export class GameSession {
  private sessionId: string;
  private teamCodes: string[];
  private players: Player[];
  private manager: Player;
  private hakem?: Player;
  private deck?: Card[];
  private currentRound: number;
  private maxRounds: number;
  private scores: { [teamCode: string]: number };
  private currentPlayerIndex: number;
  private trumpSuit?: string;
  private gameStarted: boolean;
  private gameEnded: boolean;
  private roundHistory: Round[];

  /**
   * Creates a new game session.
   * @param {string} managerName - The name of the game manager for the game session.
   * @returns {GameSession} The newly created game session.
   */
  constructor(managerName: string) {
    this.sessionId = uuidv4(); // Generate a UUID for the session ID
    this.teamCodes = [
      this.generateUniqueCode(this.sessionId + 'team1'),
      this.generateUniqueCode(this.sessionId + 'team2')
    ];
    this.players = [];
    this.manager = { id: '', teamCode: this.teamCodes[0], name: managerName };
    this.currentRound = 0;
    this.maxRounds = 0;
    this.scores = {
      [this.teamCodes[0]]: 0,
      [this.teamCodes[1]]: 0
    };
    this.currentPlayerIndex = 0;
    this.gameStarted = false;
    this.gameEnded = false;
    this.roundHistory = [];
  }

  /**
   * @returns {Object} The public state of the game session for broadcasting to clients.
   */
  public get stateForBroadcast() {
    return {
      sessionId: this.sessionId,
      team1Players: this.players.filter(
        (player) => player.teamCode === this.teamCodes[0]
      ),
      team2Players: this.players.filter(
        (player) => player.teamCode === this.teamCodes[1]
      ),
      hakem: this.hakem,
      currentRound: this.currentRound,
      team1Score: this.scores[this.teamCodes[0]],
      team2Score: this.scores[this.teamCodes[1]],
      currentPlayer: this.players[this.currentPlayerIndex],
      trumpSuit: this.trumpSuit,
      gameStarted: this.gameStarted,
      gameEnded: this.gameEnded,
      roundHistory: this.roundHistory
    };
  }

  /**
   * Adds a player to the game session.
   * @param {string} playerName - The name of the player.
   * @param {string} teamCode - The team code of the player.
   * @param {string} socketId - The socket ID of the player.
   * @returns {Player} The player that was added to the game session.
   * @throws {Error} If the player name is not unique or the team has reached its capacity.
   */
  public addPlayer(
    playerName: string,
    teamCode: string,
    socketId: string
  ): Player {
    const isNameUnique = this.players.every(
      (player) => player.name !== playerName && player.id !== socketId
    );
    if (!isNameUnique) {
      throw new Error('Player must be unique.');
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

    const player: Player = { id: socketId, teamCode, name: playerName };
    this.players.push(player);

    return player;
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
    return this.hakem;
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
  public get CurrentRound(): number {
    return this.currentRound;
  }

  /**
   * Get the maximum number of rounds in the game session.
   * @returns {number} The maximum number of rounds.
   */
  public get MaxRounds(): number {
    return this.maxRounds;
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
  public get CurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  /**
   * Get the trump suit in the game session.
   * @returns {string | null} The trump suit.
   */
  public get TrumpSuit(): string | undefined {
    return this.trumpSuit;
  }

  /**
   * Check if the game session has started.
   * @returns {boolean} True if the game session has started, false otherwise.
   */
  public get GameStarted(): boolean {
    return this.gameStarted;
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
   * Sets the value of the Hakem property.
   * @param {Player} hakem - The new value for the Hakem property.
   */
  public set Hakem(hakem: Player) {
    this.hakem = hakem;
    this.deck = this.generateShuffledDeck();
  }

  /**
   * Sets the value of the TrumpSuit property.
   * @param {string | null} trumpSuit - The new value for the TrumpSuit property.
   */
  public set TrumpSuit(trumpSuit: string) {
    this.trumpSuit = trumpSuit;
  }

  /**
   * Generate a unique 6-digit alphanumeric code based on a UUID seed.
   * @param {string} uuidSeed - The UUID seed used to generate the code.
   * @returns {string} The generated unique code.
   */
  private generateUniqueCode(uuidSeed: string): string {
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
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
      'A'
    ];

    const deck: Card[] = [];
    for (const suit of suits) {
      for (const value of values) {
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
  // Add other game functionalities as methods here
}
