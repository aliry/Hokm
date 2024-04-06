import axios from 'axios';
import { useCallback, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  cardsAtom,
  errorAtom,
  gameInitStateAtom,
  gameStateAtom
} from './gameState';
import { Socket, io } from 'socket.io-client';
import { GameAction, GameEvent, SocketEvents } from '../constants';
import { ServerEventPayload } from '../sharedTypes';
const serverURL = 'http://localhost:3001';

export const useSocketRef = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(serverURL, {
        transports: ['websocket']
      });

      socketRef.current.on('connect_error', (err: { message: any }) => {
        console.log(`connect_error due to ${err.message}`);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.off('connect_error');
          socketRef.current.off(SocketEvents.ServerEvent);
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, []);

  return socketRef.current;
};

export const useEmitAction = (socketRef: Socket | null) => {
  const emitAction = useCallback(
    (action: string, data: any) => {
      if (!socketRef) {
        return;
      }
      const payload = { action, data };
      socketRef.emit(SocketEvents.ClientAction, payload);
    },
    [socketRef]
  );

  return emitAction;
};

export const useJoinGame = (playerName: string, teamCode: string) => {
  const socket = useSocketRef();
  const emitAction = useEmitAction(socket);
  const handleSocketEvents = useSocketEvents(socket);
  const joinGame = useCallback(
    (newTeamCode?: string) => {
      if (!socket || !playerName) {
        return;
      }
      handleSocketEvents?.();
      emitAction(GameAction.JoinGame, {
        teamCode: teamCode || newTeamCode,
        playerName
      });
    },
    [emitAction, handleSocketEvents, playerName, socket, teamCode]
  );

  return joinGame;
};

export const useCreateGame = () => {
  const [gameInitState, setGameState] = useAtom(gameInitStateAtom);
  const [, setError] = useAtom(errorAtom);
  const { playerName, teamCode } = gameInitState;
  const joinGame = useJoinGame(playerName, teamCode);
  const handleCreateGame = useCallback(() => {
    const { playerName } = gameInitState;
    axios
      .post(`${serverURL}/create-game`, { managerName: playerName })
      .then((response) => {
        setGameState({
          playerName,
          sessionId: response.data.sessionId,
          teamCodes: response.data.teamCodes,
          teamCode: response.data.teamCodes[0]
        });

        joinGame(response.data.teamCodes[0]);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [gameInitState, joinGame, setGameState, setError]);

  return handleCreateGame;
};

export const useSocketEvents = (socket: Socket | null) => {
  const [, setErrors] = useAtom(errorAtom);
  const [, setCards] = useAtom(cardsAtom);
  const [, setGameState] = useAtom(gameStateAtom);

  const handleSocketEvents = useCallback(() => {
    socket?.on(SocketEvents.ServerEvent, (payload: ServerEventPayload) => {
      console.log(payload);
      if (payload.event === GameEvent.Error) {
        setErrors(payload.data);
      } else {
        if (payload.gameState) {
          const cards = payload.gameState.players.find(
            (player) => player.id === socket.id
          )?.cards;
          if (cards) {
            setCards(cards);
          }
          setGameState(payload.gameState);
        }
      }
    });
  }, [setCards, setErrors, setGameState, socket]);

  useEffect(() => {
    return () => {
      socket?.off(SocketEvents.ServerEvent);
    };
  }, [handleSocketEvents, socket]);

  return handleSocketEvents;
};
