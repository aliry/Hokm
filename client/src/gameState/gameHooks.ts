import axios from 'axios';
import { useCallback, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { errorAtom, gameInitStateAtom, gameStateAtom } from './gameState';
import { Socket, io } from 'socket.io-client';
import { GameAction, GameEvent, SocketEvents } from '../constants';
import { Card, ServerEventPayload } from '../sharedTypes';
const serverURL = 'http://localhost:3001';
let socketConnectionInProgress = false;

export const useSocketRef = () => {
  const socketRef = useRef<Socket | null>(null);
  const [, setGameInitState] = useAtom(gameInitStateAtom);
  const [, setError] = useAtom(errorAtom);

  useEffect(() => {
    if (!socketRef.current && !socketConnectionInProgress) {
      socketConnectionInProgress = true;
      socketRef.current = io(serverURL, {
        transports: ['websocket']
      });

      socketRef.current.on('connect', () => {
        const socketId = socketRef.current?.id;
        socketConnectionInProgress = false;
        if (!socketId) {
          setError('Socket id not found');
          return;
        }
        setGameInitState((prev) => ({
          ...prev,
          socketId
        }));
      });

      socketRef.current.on('connect_error', (err: { message: any }) => {
        socketConnectionInProgress = false;
        console.log(`connect_error due to ${err.message}`);
      });

      return () => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.off('connect_error');
          socketRef.current.off('connect');
          socketRef.current.off(SocketEvents.ServerEvent);
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [setError, setGameInitState]);

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
        setGameState((prev) => ({
          playerName,
          socketId: prev.socketId,
          sessionId: response.data.sessionId,
          teamCodes: response.data.teamCodes,
          teamCode: response.data.teamCodes[0]
        }));
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
  const [, setGameState] = useAtom(gameStateAtom);

  const handleSocketEvents = useCallback(() => {
    socket?.on(SocketEvents.ServerEvent, (payload: ServerEventPayload) => {
      console.log(payload);
      if (payload.event === GameEvent.Error) {
        setErrors(payload.data);
      } else if (payload.gameState) {
        setGameState(payload.gameState);
      } else {
        setErrors('Invalid server event');
      }
    });
  }, [setErrors, setGameState, socket]);

  useEffect(() => {
    return () => {
      socket?.off(SocketEvents.ServerEvent);
    };
  }, [handleSocketEvents, socket]);

  return handleSocketEvents;
};

export const useSetTrumpSuit = () => {
  const socket = useSocketRef();
  const emitAction = useEmitAction(socket);
  const setTrumpSuit = useCallback(
    (trumpSuit: string) => {
      if (!socket || !trumpSuit) {
        return;
      }
      emitAction(GameAction.SelectTrumpSuit, { trumpSuit });
    },
    [emitAction, socket]
  );

  return setTrumpSuit;
};

export const usePlayCard = () => {
  const socket = useSocketRef();
  const emitAction = useEmitAction(socket);
  const playCard = useCallback(
    (card: Card) => {
      if (!socket || !card) {
        return;
      }
      emitAction(GameAction.PlayCard, { card });
    },
    [emitAction, socket]
  );

  return playCard;
};

export const useStartNewRound = () => {
  const socket = useSocketRef();
  const emitAction = useEmitAction(socket);
  return useCallback(
    () => emitAction(GameAction.StartNewRound, {}),
    [emitAction]
  );
};
