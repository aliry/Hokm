import { Card } from './deck';

export interface Player {
  id: string;
  teamCode: string;
  name: string;
}

export interface GameSession {
  sessionId: string;
  teamCodes: string[];
  players: Player[];
  hakem: Player | null;
  manager: Player;
  deck: Card[]; // Represents the deck of cards for the game
  discardPile: Card[]; // Represents the pile of discarded cards, if applicable
  currentRound: number; // The current round number
  maxRounds: number; // The maximum number of rounds in the game
  scores: { [teamCode: string]: number }; // Object to keep track of scores for each team
  currentPlayerIndex: number; // Index of the player who has the current turn
  trumpSuit: string | null; // The trump suit for the current game, if applicable
  gameStarted: boolean; // Flag to indicate if the game has started
  gameEnded: boolean; // Flag to indicate if the game has ended
  roundHistory: Round[]; // History of all rounds played
}

interface Round {
  roundNumber: number;
  actions: Action[]; // Actions taken by players during the round
  winner: Player | null; // The player who won the round, if applicable
  score: { [teamCode: string]: number }; // Score for the round for each team
}

interface Action {
  player: Player;
  card: Card;
  // Additional properties can be added to represent specific actions taken by the player
}
