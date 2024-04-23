import axios from 'axios';
import { useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  errorAtom,
  appStateAtom,
  gameStateAtom,
  socketAtom
} from './gameState';
import { io } from 'socket.io-client';
import { GameAction, GameEvent, SocketEvents } from '../constants';
import { Card, ServerEventPayload } from '../sharedTypes';
import { produce } from 'immer';
import { DefaultCardTheme } from '../gameConfigs';

// REACT_APP_GAME_SERVER_URL will be replaced by the actual server url in github workflow based on repo variable.
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

export const useEmitAction = () => {
  const [socket] = useAtom(socketAtom);
  const emitAction = useCallback(
    (action: string, data: any) => {
      if (!socket) {
        console.log('tried to emit action without socket');
        return;
      }
      const payload = { action, data };
      socket.emit(SocketEvents.ClientAction, payload);
    },
    [socket]
  );

  return emitAction;
};

export const useJoinGame = () => {
  const [appState] = useAtom(appStateAtom);
  const { playerName, teamCode } = appState;
  const emitAction = useEmitAction();
  const handleSocketEvents = useSocketEvents();
  const joinGame = useCallback(
    (newPlayerName?: string, newTeamCode?: string) => {
      newPlayerName = newPlayerName || playerName;
      newTeamCode = newTeamCode || teamCode;
      if (!newPlayerName || !newTeamCode) {
        return;
      }
      handleSocketEvents?.();
      emitAction(GameAction.JoinGame, {
        teamCode: newTeamCode,
        playerName: newPlayerName
      });
    },
    [emitAction, handleSocketEvents, playerName, teamCode]
  );

  return joinGame;
};

export const useCreateGame = () => {
  const [appState, setAppState] = useAtom(appStateAtom);
  const [, setError] = useAtom(errorAtom);
  const joinGame = useJoinGame();
  const handleCreateGame = useCallback(
    (newPlayerName?: string) => {
      const playerName = newPlayerName || appState.playerName;
      axios
        .post(`${serverURL}/create-game`, { managerName: playerName })
        .then((response) => {
          setAppState((prev) => ({
            playerName,
            socketId: prev.socketId,
            teamCodes: response.data.teamCodes,
            teamCode: response.data.teamCodes[0],
            showTeamCodeDialog: true,
            showCardThemeDialog: false,
            sessionTimeout: false,
            cardThemeName: DefaultCardTheme
          }));
          joinGame(playerName, response.data.teamCodes[0]);
        })
        .catch((error) => {
          setError(error.message);
        });
    },
    [appState, joinGame, setAppState, setError]
  );

  return handleCreateGame;
};

export const useLoadGame = () => {
  const [appState, setAppState] = useAtom(appStateAtom);
  const [, setError] = useAtom(errorAtom);
  const { playerName, socketId } = appState;
  const joinGame = useJoinGame();
  const loadGame = useCallback(
    (newPlayerName?: string) => {
      newPlayerName = newPlayerName || playerName;
      if (!newPlayerName) {
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
              playerName: newPlayerName
            })
            .then((response) => {
              setAppState((prev) => ({
                ...prev,
                playerName: newPlayerName || prev.playerName,
                teamCodes: response.data.teamCodes,
                teamCode: response.data.teamCode,
                showTeamCodeDialog: true
              }));
              joinGame(newPlayerName, response.data.teamCode);
            })
            .catch((error) => {
              setError(error.message);
            });
        };
        reader.readAsText(file);
      };
      fileInput.click();
    },
    [playerName, socketId, setError, setAppState, joinGame]
  );

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

export const useSocketEvents = () => {
  const [, setErrors] = useAtom(errorAtom);
  const [socket] = useAtom(socketAtom);
  const [, setGameState] = useAtom(gameStateAtom);
  const [, setAppState] = useAtom(appStateAtom);

  const setPreviousGameState = useCallback(() => {
    setGameState((prevGameState) => {
      if (!prevGameState) {
        return null;
      }
      return { ...prevGameState };
    });
  }, [setGameState]);

  const handleSocketEvents = useCallback(() => {
    if (!socket) {
      console.log('tried to handle socket events without socket');
      return;
    }
    socket.on(SocketEvents.ServerEvent, (payload: ServerEventPayload) => {
      console.log(payload);
      const { gameState } = payload;
      if (payload.event === GameEvent.Error) {
        setErrors(payload.error);
        setPreviousGameState();
      } else if (payload.event === GameEvent.SessionTimeout) {
        setAppState((prev) => ({ ...prev, sessionTimeout: true }));
      } else if (gameState) {
        setGameState((prevGameState) => {
          if (!prevGameState) {
            return gameState;
          }
          return produce(prevGameState, (draft) => {
            Object.assign(draft, gameState);
          });
        });
        if (gameState?.currentRound || gameState?.roundHistory?.length > 0) {
          const showTeamCodeDialog = gameState.players.some(
            (p) => p.name === '' || !p.connected
          );
          // All players have joined and the game has started
          setAppState((prev) => ({
            ...prev,
            teamCodes: Object.keys(gameState.scores),
            showTeamCodeDialog
          }));
        }
        setErrors('');
      } else {
        setErrors('Invalid server event');
      }
    });
  }, [setAppState, setErrors, setGameState, setPreviousGameState, socket]);

  useEffect(() => {
    return () => {
      socket?.off(SocketEvents.ServerEvent);
    };
  }, [handleSocketEvents, socket]);

  return handleSocketEvents;
};

export const useSetTrumpSuit = () => {
  const emitAction = useEmitAction();
  const setTrumpSuit = useCallback(
    (trumpSuit: string) => {
      if (!trumpSuit) {
        return;
      }
      emitAction(GameAction.SelectTrumpSuit, { trumpSuit });
    },
    [emitAction]
  );

  return setTrumpSuit;
};

export const usePlayCard = () => {
  const emitAction = useEmitAction();
  const playCard = useCallback(
    (card: Card) => {
      if (!card) {
        return;
      }
      emitAction(GameAction.PlayCard, { card });
    },
    [emitAction]
  );

  return playCard;
};

export const useStartNewRound = () => {
  const emitAction = useEmitAction();
  return useCallback(
    () => emitAction(GameAction.StartNewRound, {}),
    [emitAction]
  );
};
