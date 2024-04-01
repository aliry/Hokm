/** THIS IS SHARED WITH CLIENT. DO NOT IMPORT ANYTHING OTHER THAN CONSTANTS */
import { GameAction } from './constants';
/** THIS IS SHARED WITH CLIENT. DO NOT IMPORT ANYTHING OTHER THAN CONSTANTS */

export interface Card {
  suit: string;
  value: string;
}

export interface IPlayer {
  id: string;
  name: string;
  teamCode: string;
  connected?: boolean;
  cards?: Card[];
}

/**
 * Represents a round in the game.
 */
export interface Round {
  /**
   * The round number.
   */
  roundNumber: number;
  /**
   * The index of the hakem in the players array.
   */
  hakemIndex?: number;
  /**
   * The trump suit for the round, if applicable.
   */
  trumpSuit?: string;
  /**
   * Score for the round for each team.
   */
  score?: { [teamCode: string]: number };
  /**
   * The team that won the round.
   */
  winnerTeam?: string;
}

/**
 * Represents a trick in the game.
 */
export interface Trick {
  items: { playerIndex: number; card: Card }[];
  winnerIndex?: number;
}

export interface Action {
  player: PlayerState;
  card: Card;
  // Additional properties can be added to represent specific actions taken by the player
}

export interface PlayerState {
  id: string;
  name: string;
  teamCode: string;
  cards?: Card[];
}

export interface GameSessionState {
  sessionId: string;
  players: PlayerState[];
  hakem?: PlayerState;
  currentRound?: Round;
  scores: { [teamCode: string]: number };
  currentPlayer?: PlayerState;
  gameStarted: boolean;
  gameEnded: boolean;
  roundHistory: Round[];
}
export interface GameState extends Omit<GameSessionState, 'players'> {
  teamCodes: string[];
  players: IPlayer[];
  manager: PlayerState;
  deck?: Card[];
  currentRoundNumber: number;
  currentPlayerIndex?: number;
  createdDateTime: string;
}

export interface ClientActionPayload {
  action: GameAction;
  data?: any;
}

export interface ServerEventPayload {
  event: string;
  data?: any;
  gameState: GameSessionState;
}
