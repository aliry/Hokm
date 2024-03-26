import express from 'express';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSession } from './types';
import { createNewSession } from './utils';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

const sessions: Record<string, GameSession> = {};

// Endpoint to create a new game session
app.get('/create-game', (req, res) => {
  // In a real application, authenticate the user and obtain their user ID
  const managerId = 'managerId'; // Placeholder for the manager's user ID
  const session = createNewSession(managerId);
  sessions[session.sessionId] = session;
  res.json({ sessionId: session.sessionId, teamCodes: session.teamCodes });
});

io.on('connection', (socket: Socket) => {
  // Handle players joining the game
  socket.on('join-game', (teamCode: string) => {
    const session = Object.values(sessions).find((session) =>
      session.teamCodes.includes(teamCode)
    );
    if (!session) {
      socket.emit('error', 'Invalid team code');
      return;
    }
    if (session.players.length >= 4) {
      socket.emit('error', 'Game is full');
      return;
    }
    // Add player to the session
    session.players.push({ id: socket.id, teamCode });
    socket.join(session.sessionId);
    if (session.players.length === 4) {
      io.to(session.sessionId).emit('all-players-joined');
      // Additional logic to start the game
    }
  });

  // Handle game starting
  socket.on('start-game', (sessionId: string) => {
    const session = sessions[sessionId];
    if (!session || session.players.length !== 4) {
      socket.emit('error', 'Game cannot start');
      return;
    }
    // Randomly pick hakem and assign cards
    // Additional logic to start the game
  });

  // Additional event handlers for game logic
});

httpServer.listen(3000, () => {
  console.log('Server is running on port 3000');
});
