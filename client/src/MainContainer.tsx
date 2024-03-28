import { GameEvent } from './constants';
import React, { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Socket, io } from 'socket.io-client';

const serverURL = 'http://localhost:3001';

export const MainContainer = () => {
  const [playerName, setPlayerName] = React.useState<string>('');
  const [teamCodes, setTeamCodes] = React.useState<string[]>([]);
  const [sessionId, setSessionId] = React.useState<string>('');
  const [teamCode, setTeamCode] = React.useState<string>('');
  const [errors, setErrors] = React.useState<string[]>([]);
  const [gameStates, setGameStates] = React.useState<any[]>([]);
  const [trumpSuit, setTrumpSuit] = React.useState<string>('');
  const socketRef = useRef<Socket | null>(null);

  const removeSocketEvents = useCallback(() => {
    socketRef.current?.off(GameEvent.TrumpSuitSelected);
    socketRef.current?.off(GameEvent.HakemCards);
    socketRef.current?.off(GameEvent.HakemSelected);
    socketRef.current?.off(GameEvent.PlayerJoined);
    socketRef.current?.off(GameEvent.PlayerLeft);
    socketRef.current?.off(GameEvent.RoundStarted);
    socketRef.current?.off(GameEvent.RoundEnded);
    socketRef.current?.off(GameEvent.Error);
  }, []);

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
          removeSocketEvents();
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [removeSocketEvents]);

  const handleCreateGame = () => {
    console.log('Join Game');
    axios
      .post(`${serverURL}/create-game`, { managerName: playerName })
      .then((response) => {
        console.log(response);
        setSessionId(response.data.sessionId);
        setTeamCodes(response.data.teamCodes);
        setTeamCode(response.data.teamCodes[0]);
      })
      .catch((error) => {
        console.error(error);
        setErrors((prevErrors) => [...prevErrors, error.message]);
      });
  };

  const handleSocketEvents = useCallback(() => {
    socketRef.current?.on(GameEvent.TrumpSuitSelected, (data: any) => {
      console.log(data);
      setGameStates((prevStates) => [...prevStates, data]);
    });
    socketRef.current?.on(GameEvent.HakemCards, (data: any) => {
      console.log(data);
      setGameStates((prevStates) => [...prevStates, data]);
    });
    socketRef.current?.on(GameEvent.HakemSelected, (data: any) => {
      console.log(data);
      setGameStates((prevStates) => [...prevStates, data]);
    });
    socketRef.current?.on(GameEvent.PlayerJoined, (data: any) => {
      console.log(data);
      setGameStates((prevStates) => [...prevStates, data]);
    });
    socketRef.current?.on(GameEvent.PlayerLeft, (data: any) => {
      console.log(data);
      setGameStates((prevStates) => [...prevStates, data]);
    });
    socketRef.current?.on(GameEvent.RoundStarted, (data: any) => {
      console.log(data);
      setGameStates((prevStates) => [...prevStates, data]);
    });
    socketRef.current?.on(GameEvent.RoundEnded, (data: any) => {
      console.log(data);
      setGameStates((prevStates) => [...prevStates, data]);
    });

    socketRef.current?.on(GameEvent.Error, (data: string) => {
      console.log(data);
      setErrors((prevErrors) => [...prevErrors, data]);
    });
  }, []);

  const handleJoinGame = useCallback(() => {
    if (!socketRef.current || !teamCode || !playerName) {
      return;
    }
    handleSocketEvents();
    socketRef.current?.emit(GameEvent.JoinGame, { teamCode, playerName });
  }, [handleSocketEvents, teamCode, playerName]);

  useEffect(() => {
    handleJoinGame();
  }, [handleJoinGame, teamCode]);

  const handleSelectTrumpSuit = () => {
    if (!socketRef.current || !trumpSuit) {
      return;
    }
    socketRef.current.emit(GameEvent.SetTrumpSuit, trumpSuit);
  };

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ border: '1px black solid' }}>
        <div style={{ border: '1px black dashed', padding: 5 }}>
          <label>Player Name:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <div style={{ border: '1px black dashed', padding: 5 }}>
          <button
            style={{
              padding: 15,
              margin: 5,
              color: 'darkGreen',
              fontWeight: 'bold'
            }}
            onClick={handleCreateGame}
          >
            Create Game
          </button>
        </div>
        <div style={{ border: '1px black dashed', padding: 5 }}>
          <label>Team Code:</label>
          <input
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
          />
          <div>
            <button
              style={{ padding: 10, margin: 5, color: 'green' }}
              onClick={handleJoinGame}
            >
              Join Game
            </button>
          </div>
        </div>
        <div style={{ border: '1px black dashed', padding: 5 }}>
          <label>Trump Suit:</label>
          <input
            type="text"
            value={trumpSuit}
            onChange={(e) => setTrumpSuit(e.target.value)}
          />
          <div>
            <button onClick={handleSelectTrumpSuit}>Select Trump Suit</button>
          </div>
        </div>
      </div>
      <div>
        <textarea
          rows={40}
          cols={150}
          value={gameStates
            .map((state) => JSON.stringify(state, null, 2))
            .join('\n===========\n')}
          style={{ color: 'blue' }}
        />
        <textarea
          rows={10}
          cols={100}
          value={errors.join('\n===========\n')}
          style={{ color: 'red' }}
        />
      </div>
      {teamCodes.length === 2 && (
        <div>
          <div>
            <label>Team 1:</label>
            <input type="text" value={teamCodes[0]} readOnly />
          </div>
          <div>
            <label>Team 2:</label>
            <input type="text" value={teamCodes[1]} readOnly />
          </div>
          <div>
            <label>Session ID:</label>
            <input type="text" value={sessionId} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};
