import { atom } from 'jotai';
import { Card, GameSessionState } from '../sharedTypes';
import { Socket } from 'socket.io-client';

interface InitialState {
  playerName: string;
  socketId: string;
  teamCodes: string[];
  teamCode: string;
}

export const socketAtom = atom<Socket | null>(null);

export const gameInitStateAtom = atom<InitialState>({
  playerName: '',
  socketId: '',
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
