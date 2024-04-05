import axios from 'axios';
import { useCallback, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { errorAtom, gameStateAtom } from './gameState';
import { Socket, io } from 'socket.io-client';
import { SocketEvents } from '../constants';
const serverURL = 'http://localhost:3001';

export const useCreateGame = (playerName: string) => {
  const [, setGameState] = useAtom(gameStateAtom);
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
