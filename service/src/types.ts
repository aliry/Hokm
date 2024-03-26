export interface Player {
  id: string;
  teamCode: string;
  name: string;
}

export interface Card {
  suit: string;
  value: string;
}

export interface Round {
  roundNumber: number;
  actions: Action[]; // Actions taken by players during the round
  winner: Player | null; // The player who won the round, if applicable
  score: { [teamCode: string]: number }; // Score for the round for each team
}

export interface Action {
  player: Player;
  card: Card;
  // Additional properties can be added to represent specific actions taken by the player
}
