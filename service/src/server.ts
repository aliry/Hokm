import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { SocketHandler } from './socketHandler';

const app = express();
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameSessions = new GameSessionManager();
const socketHandler = new SocketHandler(io, gameSessions);

// Endpoint to create a new game session
app.post('/create-game', (req, res) => {
  const managerName: string = req.body.managerName;

  if (!managerName) {
    return res.status(400).send('Manager name is required');
  }

  try {
    // TODO: we need to remove inactive game sessions. Also the manager should create web socket connection in less than 3 seconds
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

httpServer.listen(3001, () => {
  console.log('Server is running on port 3001');
});
