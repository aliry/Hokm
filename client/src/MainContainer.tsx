import { GameEvent } from './constants';
import React from 'react';
import axios from 'axios';
import { Socket, io } from 'socket.io-client';

const serverURL = 'http://localhost:3001';

export const MainContainer = () => {
  const [playerName, setPlayerName] = React.useState<string>();
  const [teamCodes, setTeamCodes] = React.useState<string[]>([]);
  const [sessionId, setSessionId] = React.useState<string>('');
  const [teamCode, setTeamCode] = React.useState<string>('');
  const [socket, setSocket] = React.useState<Socket>();

  React.useEffect(() => {
    const socket = io(serverURL, {
      transports: ['websocket']
    });
    setSocket(socket);

    return () => {
      socket?.disconnect();
    };
  }, []);

  const handleEvent = (event: GameEvent) => {
    console.log(event);
  };

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
      });
  };

  const handleJoinGame = () => {
    handleSocketEvents();
    socket?.emit(GameEvent.JoinGame, { teamCode, playerName });
  };

  const handleSocketEvents = () => {
    socket?.on(GameEvent.JoinGame, (data) => {
      console.log(data);
    });
    socket?.on(GameEvent.Error, (data) => {
      console.log(data);
    });
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
            style={{ padding: 15, margin: 5, color: 'red' }}
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
        {Object.entries(GameEvent).map(([key, value]) => (
          <div key={key}>
            <button
              key={key}
              style={{ padding: 5, margin: 5 }}
              onClick={() => handleEvent(value)}
            >
              {value}
            </button>
          </div>
        ))}
      </div>
      <div>
        <textarea rows={40} cols={150} />
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
