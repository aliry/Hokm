import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { SocketHandler } from './socketHandler';
import { defaultClient as aiClient } from 'applicationinsights';
import './appInsight';
import { version } from '../package.json';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(cors());

// Track requests with Application Insights
app.use((req, res, next) => {
  aiClient.trackNodeHttpRequest({ request: req, response: res });
  next();
});

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
    res.status(400).send(error.message);
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

io.on('connection', (socket: Socket) => {
  socketHandler.handleConnection(socket);
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
