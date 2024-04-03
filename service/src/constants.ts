/** SHOULD NOT IMPORT ANYTHING SINCE THIS IS SHARED WITH CLIENT */

export enum SocketEvents {
  ServerEvent = 'server-event',
  ClientAction = 'client-action'
}

/**
 * Represents the different game events the server can emit
 */
export enum GameEvent {
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
  SessionDestroyed = 'session-destroyed',
  CardPlayed = 'card-played',
  GameState = 'game-state'
}

/**
 * Represents the different actions the client can send to the server
 */
export enum GameAction {
  Disconnect = 'disconnect',
  PlayCard = 'play-card',
  CreateGame = 'create-game',
  JoinGame = 'join-game',
  SelectHakem = 'select-hakem',
  SelectTrumpSuit = 'select-trump-suit',
  StartNewRound = 'start-new-round'
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
