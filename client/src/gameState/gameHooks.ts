import axios from 'axios';
import { useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  errorAtom,
  appStateAtom,
  gameStateAtom,
  socketAtom
} from './gameState';
import { Socket, io } from 'socket.io-client';
import { GameAction, GameEvent, SocketEvents } from '../constants';
import { Card, ServerEventPayload } from '../sharedTypes';
import { produce } from 'immer';
const serverURL =
  process.env.REACT_APP_GAME_SERVER_URL || 'http://localhost:3001';
let socketConnectionInProgress = false;

export const useSocket = () => {
  const [socket, setSocket] = useAtom(socketAtom);
  const [, setAppState] = useAtom(appStateAtom);
  const [, setError] = useAtom(errorAtom);

  useEffect(() => {
    if (!socket && !socketConnectionInProgress) {
      socketConnectionInProgress = true;
      const _socket = io(serverURL, { transports: ['websocket'] });
      setSocket(_socket);

      _socket.on('connect', () => {
        const socketId = _socket.id;
        socketConnectionInProgress = false;
        if (!socketId) {
          setError('Socket id not found');
          return;
        }
        setAppState((prev) => ({
          ...prev,
          socketId
        }));
      });

      _socket.on('connect_error', (err: { message: any }) => {
        socketConnectionInProgress = false;
        console.log(`connect_error due to ${err.message}`);
      });

      return () => {
        if (_socket && _socket.connected) {
          _socket.off('connect_error');
          _socket.off('connect');
          _socket.off(SocketEvents.ServerEvent);
          _socket.disconnect();
          setSocket(null);
        }
      };
    }
  }, [setError, setAppState, setSocket, socket]);
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
  const [socket] = useAtom(socketAtom);
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
  const [appState, setAppState] = useAtom(appStateAtom);
  const [, setError] = useAtom(errorAtom);
  const { playerName, teamCode } = appState;
  const joinGame = useJoinGame(playerName, teamCode);
  const handleCreateGame = useCallback(() => {
    const { playerName } = appState;
    axios
      .post(`${serverURL}/create-game`, { managerName: playerName })
      .then((response) => {
        setAppState((prev) => ({
          playerName,
          socketId: prev.socketId,
          teamCodes: response.data.teamCodes,
          teamCode: response.data.teamCodes[0]
        }));
        joinGame(response.data.teamCodes[0]);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [appState, joinGame, setAppState, setError]);

  return handleCreateGame;
};

export const useLoadGame = () => {
  const [appState, setAppState] = useAtom(appStateAtom);
  const [, setError] = useAtom(errorAtom);
  const { playerName, socketId, teamCode } = appState;
  const joinGame = useJoinGame(playerName, teamCode);
  const loadGame = useCallback(() => {
    if (!playerName) {
      setError('Player name is required to load game');
      return;
    }

    if (!socketId) {
      setError('Socket ID is required to load game');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.hokm';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const gameState = e.target?.result as string;
        axios
          .post(`${serverURL}/game-state`, {
            gameState,
            playerName
          })
          .then((response) => {
            setAppState((prev) => ({
              ...prev,
              teamCodes: response.data.teamCodes,
              teamCode: response.data.teamCode
            }));
            joinGame(response.data.teamCode);
          })
          .catch((error) => {
            setError(error.message);
          });
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }, [playerName, socketId, setError, setAppState, joinGame]);

  return loadGame;
};

export const useSaveGame = () => {
  const [appState] = useAtom(appStateAtom);
  const [gameState] = useAtom(gameStateAtom);
  const { socketId } = appState;
  const { sessionId } = gameState || {};
  const downloadString = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.download = 'game-state.hokm';
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  };
  const saveGame = useCallback(() => {
    axios
      .get(`${serverURL}/game-state`, {
        params: {
          sessionId,
          socketId
        }
      })
      .then((response) => {
        downloadString(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [sessionId, socketId]);

  return saveGame;
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
        setGameState((prevGameState) => {
          if (!prevGameState) {
            return payload.gameState;
          }
          return produce(prevGameState, (draft) => {
            Object.assign(draft, payload.gameState);
          });
        });
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
  const [socket] = useAtom(socketAtom);
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
  const [socket] = useAtom(socketAtom);
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
  const [socket] = useAtom(socketAtom);
  const emitAction = useEmitAction(socket);
  return useCallback(
    () => emitAction(GameAction.StartNewRound, {}),
    [emitAction]
  );
};
