import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { SocketHandler } from './socketHandler';
import './appInsight';
import { ExtendedError } from 'socket.io/dist/namespace';

const isDevMode = process.env.NODE_ENV === 'development';
const { version } = isDevMode
  ? require('../package.json')
  : require('./package.json');

// load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 3001;

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',').map((origin) =>
    origin.trim()
  ),
  methods: ['GET', 'POST']
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: corsOptions
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
    res.status(500).send(error.message);
  }
});

// endpoint to download the game state. params: sessionId, socketId
app.get('/game-state', (req, res) => {
  const sessionId = req.query.sessionId as string;
  const socketId = req.query.socketId as string;

  if (!sessionId || !socketId) {
    return res.status(400).send('sessionId and socketId are required');
  }

  try {
    const encryptedGameState = gameSessions.encryptGameState(
      sessionId,
      socketId
    );
    res.json(encryptedGameState);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// endpoint to load the game state. params: sessionId, socketId, gameState
app.post('/game-state', (req, res) => {
  const gameState = req.body.gameState as string;
  const playerName = req.body.playerName as string;

  try {
    const session = gameSessions.decryptAndLoadGameState(gameState, playerName);
    const teamCode = session.Players.find(
      (player) => player.name === playerName
    )?.teamCode;
    res.json({
      sessionId: session.SessionId,
      teamCodes: session.TeamCodes,
      teamCode
    });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

// health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// get version
app.get('/version', (req, res) => {
  res.status(200).json({ version });
});

const messageLimiter = (timeFrame: number, maxMessages: number) => {
  const users = new Map();

  return (socket: Socket, next: (err?: ExtendedError) => void) => {
    const now = Date.now();
    const record = users.get(socket.id) || { count: 0, lastMessageTime: now };

    if (now - record.lastMessageTime > timeFrame) {
      // Reset the count if the time frame has passed
      record.count = 1;
      record.lastMessageTime = now;
      users.set(socket.id, record);
      next();
    } else {
      // Increment the message count
      record.count += 1;
      if (record.count <= maxMessages) {
        // Allow the message through if within limits
        users.set(socket.id, record);
        next();
      } else {
        // Disconnect the client if the limit is exceeded
        socket.emit('rate_limit', {
          message:
            'You have exceeded the message limit. You will be disconnected.'
        });
        // Use a short timeout to ensure the client receives the rate limit message before disconnecting
        setTimeout(() => {
          socket.disconnect(true);
        }, 1000);
      }
    }

    // Optionally clean up the users map for disconnected sockets
    socket.on('disconnect', () => {
      users.delete(socket.id);
    });
  };
};

// Apply the message rate limiting middleware. 30 messages per minute per socket
io.use(messageLimiter(60000, 30));

io.on('connection', (socket: Socket) => {
  socketHandler.handleConnection(socket);
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
