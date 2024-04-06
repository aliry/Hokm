import { atom } from 'jotai';
import { Card, GameSessionState } from '../sharedTypes';

interface InitialState {
  playerName: string;
  sessionId: string;
  teamCodes: string[];
  teamCode: string;
}
export const gameInitStateAtom = atom<InitialState>({
  playerName: '',
  sessionId: '',
  teamCodes: [],
  teamCode: ''
});

export const errorAtom = atom<string>('');

export const gameStateAtom = atom<GameSessionState | null>(null);
export const cardsAtom = atom<Card[]>([]);
