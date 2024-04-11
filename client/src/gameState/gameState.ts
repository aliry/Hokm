import { atom } from 'jotai';
import { Card, GameSessionState, PlayerState } from '../sharedTypes';
import { Socket } from 'socket.io-client';
import { CardValues, Suits } from '../constants';

interface InitialState {
  playerName: string;
  socketId: string;
  teamCodes: string[];
  teamCode: string;
}

export const socketAtom = atom<Socket | null>(null);

export const appStateAtom = atom<InitialState>({
  playerName: '',
  socketId: '',
  teamCodes: [],
  teamCode: ''
});

export const errorAtom = atom<string>('');

export const gameStateAtom = atom<GameSessionState | null>(null);

export const myPlayerAtom = atom<PlayerState | null>((get) => {
  const gameState = get(gameStateAtom);
  const { socketId } = get(appStateAtom);
  return gameState?.players.find((player) => player.id === socketId) || null;
});

export const playersAtom = atom<PlayerState[] | null>((get) => {
  const gameState = get(gameStateAtom);
  return gameState?.players || null;
});

export const cardsAtom = atom<Card[]>((get) => {
  const gameState = get(gameStateAtom);
  const { socketId } = get(appStateAtom);
  if (!gameState) return [];
  let cards = gameState.players.find((player) => player.id === socketId)?.cards;
  if (!cards) return [];
  if (cards.length < 3) return cards;
  // order cards by suit and value when there are more than 3 cards
  cards = [...cards]; // Create a copy of the array
  cards = cards.sort((a, b) => {
    if (a.suit === b.suit) {
      return CardValues.indexOf(a.value) - CardValues.indexOf(b.value);
    }
    return Suits.indexOf(a.suit) - Suits.indexOf(b.suit);
  });

  return cards;
});

export const trumpSuitAtom = atom<string>((get) => {
  const gameState = get(gameStateAtom);
  return gameState?.currentRound?.trumpSuit || '';
});

/**
 * Returns cards played by each player in the current trick in the order of the players
 * @returns An array of cards played by each player, with null values for players who haven't played yet.
 */
export const currentTrickPlayedCardsAtom = atom<Array<Card | null>>((get) => {
  const gameState = get(gameStateAtom);
  const cards: (Card | null)[] = [null, null, null, null];
  if (!gameState?.currentRound) return cards;
  const tricks = gameState.currentRound.tricks;
  const currentTrickItems = tricks[tricks.length - 1]?.items;
  if (!currentTrickItems) return cards;
  currentTrickItems.forEach((item) => {
    cards[item.playerIndex] = item.card;
  });

  return cards;
});

export const currentPlayerAtom = atom<PlayerState | undefined>((get) => {
  const gameState = get(gameStateAtom);
  return gameState?.currentPlayer;
});

export const isCurrentPlayerTurnAtom = atom<boolean>((get) => {
  const currentPlayer = get(currentPlayerAtom);
  const { socketId } = get(appStateAtom);
  return currentPlayer?.id === socketId;
});

export const hakemPlayerAtom = atom<PlayerState | null>((get) => {
  const gameState = get(gameStateAtom);
  if (gameState?.currentRound?.hakemIndex === undefined) return null;
  return gameState?.players[gameState?.currentRound?.hakemIndex] || null;
});
