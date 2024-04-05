import { atom } from 'jotai';

interface InitialState {
  sessionId: string;
  teamCodes: string[];
  teamCode: string;
}
export const gameStateAtom = atom<InitialState>({
  sessionId: '',
  teamCodes: [],
  teamCode: ''
});

export const errorAtom = atom<string>('');
