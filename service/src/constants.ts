import exp from 'constants';

export enum GameEvent {
  CardPlayed = 'card-played',
  Disconnect = 'disconnect',
  Error = 'error',
  GameEnded = 'game-ended',
  HakemCards = 'hakem-cards',
  HakemSelected = 'hakem-selected',
  JoinGame = 'join-game',
  PlayerJoined = 'player-joined',
  PlayerLeft = 'player-left',
  RoundEnded = 'round-ended',
  RoundStarted = 'round-started',
  SetTrumpSuit = 'set-trump-suit',
  TrickEnded = 'trick-ended',
  TrickStarted = 'trick-started',
  TrumpSuitSelected = 'trump-suit-selected',
  SessionDestroyed = 'session-destroyed'
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
