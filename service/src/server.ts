import express from 'express';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { SocketHandler } from './socketHandler';

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

const gameSessions = new GameSessionManager();
const socketHandler = new SocketHandler(io, gameSessions);

// Endpoint to create a new game session
app.post('/create-game', (req, res) => {
  const managerName: string = req.body.managerName;

  if (!managerName) {
    return res.status(400).send('Manager name is required');
  }

  try {
    const session = gameSessions.createGameSession(managerName);
    res.json({
      sessionId: session.SessionId,
      teamCodes: session.TeamCodes,
      managerName
    });
  } catch (error: any) {
    console.error('Error creating game session:', error);
    res.status(400).send(error.message);
  }
});

io.on('connection', (socket: Socket) => {
  socketHandler.handleConnection(socket);
});

httpServer.listen(3000, () => {
  console.log('Server is running on port 3000');
});
