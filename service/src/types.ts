import { Player } from './player';

export interface Card {
  suit: string;
  value: string;
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
  /**
   * The tricks played in the round.
   */
  tricks: Trick[];
}

/**
 * Represents a trick in the game.
 */
export type Trick = Array<{ player: Player; card: Card }>;

export interface Action {
  player: Player;
  card: Card;
  // Additional properties can be added to represent specific actions taken by the player
}
