import { atom } from 'jotai';
import { Card, GameSessionState, PlayerState } from '../sharedTypes';
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

export const myTeamPlayersAtom = atom<{
  me: PlayerState;
  partner: PlayerState;
} | null>((get) => {
  const gameState = get(gameStateAtom);
  const { teamCode, socketId } = get(gameInitStateAtom);
  if (!gameState) return null;
  const me = gameState.players.find((player) => player.id === socketId);
  const partner = gameState.players.find(
    (player) => player.teamCode === teamCode && player.id !== socketId
  );
  if (!me || !partner) return null;
  return { me, partner };
});

export const opponentTeamPlayersAtom = atom<{
  player1: PlayerState;
  player2: PlayerState;
} | null>((get) => {
  const gameState = get(gameStateAtom);
  const { teamCode } = get(gameInitStateAtom);
  if (!gameState) return null;
  const opponents = gameState.players.filter(
    (player) => player.teamCode !== teamCode
  );
  return opponents.length === 2
    ? { player1: opponents[0], player2: opponents[1] }
    : null;
});

export const playerPlayedCardAtom = atom<{
  myCard: Card | null;
  partnerCard: Card | null;
  opponent1Card: Card | null;
  opponent2Card: Card | null;
} | null>((get) => {
  const gameState = get(gameStateAtom);
  const myTeamPlayers = get(myTeamPlayersAtom);
  const opponentTeamPlayers = get(opponentTeamPlayersAtom);

  if (!gameState?.currentRound?.tricks?.length) return null;
  const currentTrick =
    gameState.currentRound.tricks[gameState.currentRound.tricks.length - 1];
  let myCard: Card | null = null;
  let partnerCard: Card | null = null;
  let opponent1Card: Card | null = null;
  let opponent2Card: Card | null = null;

  currentTrick.items.forEach((item) => {
    if (gameState.players[item.playerIndex].id === myTeamPlayers?.me.id) {
      myCard = item.card;
    } else if (
      gameState.players[item.playerIndex].id === myTeamPlayers?.partner.id
    ) {
      partnerCard = item.card;
    } else if (
      gameState.players[item.playerIndex].id === opponentTeamPlayers?.player1.id
    ) {
      opponent1Card = item.card;
    } else if (
      gameState.players[item.playerIndex].id === opponentTeamPlayers?.player2.id
    ) {
      opponent2Card = item.card;
    } else {
      throw new Error('Player not found');
    }
  });

  return { myCard, partnerCard, opponent1Card, opponent2Card };
});
