export enum GameEvent {
  Disconnect = 'disconnect',
  Error = 'error',
  GameEnded = 'game-ended',
  HakemCards = 'hakem-cards',
  HakemSelected = 'hakem-selected',
  PlayerJoined = 'player-joined',
  PlayerLeft = 'player-left',
  RoundEnded = 'round-ended',
  RoundStarted = 'round-started',
  TrickEnded = 'trick-ended',
  TrickStarted = 'trick-started',
  TrumpSuitSelected = 'trump-suit-selected',
  SessionDestroyed = 'session-destroyed'
}

export enum GameAction {
  CardPlayed = 'card-played',
  CreateGame = 'create-game',
  JoinGame = 'join-game',
  SelectHakem = 'select-hakem',
  SelectTrumpSuit = 'select-trump-suit'
}

export const Suits = ['hearts', 'diamonds', 'clubs', 'spades'];
export const CardValues = [
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
