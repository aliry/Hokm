/** THIS IS SHARED WITH CLIENT. DO NOT IMPORT ANYTHING OTHER THAN CONSTANTS */
import { GameAction } from './constants';
/** THIS IS SHARED WITH CLIENT. DO NOT IMPORT ANYTHING OTHER THAN CONSTANTS */

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface IPlayer {
  id?: string;
  name: string;
  teamCode: string;
  connected?: boolean;
  cards?: Card[];
}

/**
 * Represents a round in the game.
 */
export interface RoundBase {
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
  score: { [teamCode: string]: number };
  /**
   * The team that won the round.
   */
  winnerTeam?: string;
}

/**
 * Represents a round in the game including the tricks played.
 */
export interface Round extends RoundBase {
  /**
   * The tricks played in the round.
   */
  tricks: Trick[];
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
  id?: string;
  name: string;
  teamCode: string;
  connected: boolean;
  cards?: Card[];
}

interface GameStateBase {
  sessionId: string;
  hakem?: PlayerState;
  scores: { [teamCode: string]: number };
  currentPlayer?: PlayerState;
  roundHistory: RoundBase[];
}

export interface GameSessionState extends GameStateBase {
  players: PlayerState[];
  currentRound?: Round;
}
export interface GameState extends GameStateBase {
  teamCodes: string[];
  players: IPlayer[];
  manager: PlayerState;
  deck?: Card[];
  currentRound?: Round;
  currentPlayerIndex?: number;
  createdDateTime: string;
}

export interface ClientActionPayload {
  action: GameAction;
  data?: any;
}

export interface ServerEventPayload {
  event: string;
  error?: any;
  gameState: GameSessionState;
}
