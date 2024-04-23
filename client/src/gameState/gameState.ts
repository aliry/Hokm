import { atom } from 'jotai';
import { Card, GameSessionState, PlayerState } from '../sharedTypes';
import { Socket } from 'socket.io-client';
import { CardValues } from '../constants';
import { DefaultCardTheme } from '../gameConfigs';

interface AppState {
  playerName: string;
  socketId: string;
  teamCodes: string[];
  teamCode: string;
  showTeamCodeDialog: boolean;
  showCardThemeDialog: boolean;
  sessionTimeout: boolean;
  cardThemeName: string;
}

export const socketAtom = atom<Socket | null>(null);

export const appStateAtom = atom<AppState>({
  playerName: '',
  socketId: '',
  teamCodes: [],
  teamCode: '',
  showTeamCodeDialog: false,
  showCardThemeDialog: false,
  sessionTimeout: false,
  cardThemeName: DefaultCardTheme
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

  return sortCards([...cards])
});

/**
 * Sorts an array of cards by their value and suit in alternating suit colors.
 * 
 * @param cards - An array of cards to be sorted.
 * @returns An array of cards sorted by value and separated by suits.
 */
function sortCards(cards: Card[] | undefined) {
  if (!cards) return [];
  if (cards.length < 2) return cards; // No need to sort if there is only one card  

  // Sort the cards by value
  const sortByValue = (a: Card, b: Card) =>
    CardValues.indexOf(a.value) - CardValues.indexOf(b.value);

  // Separate the cards by suits and sort them by value
  const hearts = cards.filter(card => card.suit === "hearts").sort(sortByValue);
  const spades = cards.filter(card => card.suit === "spades").sort(sortByValue);
  const diamonds = cards.filter(card => card.suit === "diamonds").sort(sortByValue);
  const clubs = cards.filter(card => card.suit === "clubs").sort(sortByValue);

  const redSuits: Card[][] = []
  const blackSuits: Card[][] = []

  // add the suits to the respective arrays if there are cards in the suit
  if (hearts.length > 0) redSuits.push(hearts);
  if (diamonds.length > 0) redSuits.push(diamonds);
  if (spades.length > 0) blackSuits.push(spades);
  if (clubs.length > 0) blackSuits.push(clubs);

  const combinedCards: Card[] = [];

  // if both colors have suits, we need to alternate between the colors
  let isRedTurn = redSuits.length >= blackSuits.length;
  while (redSuits.length > 0 && blackSuits.length > 0) {
    if (isRedTurn) {
      combinedCards.push(...(redSuits.pop() || []));
    } else {
      combinedCards.push(...(blackSuits.pop() || []));
    }
    isRedTurn = !isRedTurn;
  }

  // add the remaining suits
  if (redSuits.length > 0) {
    combinedCards.push(...redSuits.flat());
  }
  if (blackSuits.length > 0) {
    combinedCards.push(...blackSuits.flat());
  }

  return combinedCards;
}

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