export interface Player {
  id: string;
  teamCode: string;
  // Add a new field for the player's name
  name?: string;
}

export interface GameSession {
  sessionId: string;
  teamCodes: string[];
  players: Player[];
  hakem: string | null;
}
