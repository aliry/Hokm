import { atom } from 'jotai';
import { Card, GameSessionState } from '../sharedTypes';

interface InitialState {
  playerName: string;
  socketId: string;
  sessionId: string;
  teamCodes: string[];
  teamCode: string;
}
export const gameInitStateAtom = atom<InitialState>({
  playerName: '',
  socketId: '',
  sessionId: '',
  teamCodes: [],
  teamCode: ''
});

export const errorAtom = atom<string>('');

export const gameStateAtom = atom<GameSessionState | null>(null);

export const cardsAtom = atom<Card[]>((get) => {
  const gameState = get(gameStateAtom);
  const { socketId } = get(gameInitStateAtom);
  if (!gameState) return [];
  const cards = gameState.players.find(
    (player) => player.id === socketId
  )?.cards;
  return cards || [];
});

export const trumpSuitAtom = atom<string>((get) => {
  const gameState = get(gameStateAtom);
  return gameState?.currentRound?.trumpSuit || '';
});
