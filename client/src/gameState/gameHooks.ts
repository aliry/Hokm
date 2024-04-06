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

export const useCreateGame = (playerName: string) => {
  const [, setGameState] = useAtom(gameInitStateAtom);
  const [, setError] = useAtom(errorAtom);
  const handleCreateGame = useCallback(() => {
    axios
      .post(`${serverURL}/create-game`, { managerName: playerName })
      .then((response) => {
        setGameState({
          sessionId: response.data.sessionId,
          teamCodes: response.data.teamCodes,
          teamCode: response.data.teamCodes[0]
        });
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [playerName, setError, setGameState]);

  return handleCreateGame;
};

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

export const useJoinGame = (socketRef: Socket | null) => {
  const [, setGameState] = useAtom(gameInitStateAtom);
  const emitAction = useEmitAction(socketRef);
  const joinGame = useCallback(
    (teamCode: string, playerName: string) => {
      if (!socketRef || !teamCode || !playerName) {
        return;
      }

      setGameState((prev) => ({ ...prev, teamCode }));
      emitAction(GameAction.JoinGame, { teamCode, playerName });
    },
    [emitAction, setGameState, socketRef]
  );

  return joinGame;
};

export const useSocketEvents = (socket: Socket) => {
  const [, setErrors] = useAtom(errorAtom);
  const [, setCards] = useAtom(cardsAtom);
  const [, setGameState] = useAtom(gameStateAtom);

  const handleSocketEvents = useCallback(() => {
    socket.on(SocketEvents.ServerEvent, (payload: ServerEventPayload) => {
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
    handleSocketEvents();
    return () => {
      if (socket) {
        socket.off(SocketEvents.ServerEvent);
      }
    };
  }, [handleSocketEvents, socket]);

  return null;
};
