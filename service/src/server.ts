import express from 'express';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSession } from './types';
import { createNewSession } from './gameSession';
import { generateDeck } from './deck';

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

const sessions: { [sessionId: string]: GameSession } = {};

// Endpoint to create a new game session
app.post('/create-game', (req, res) => {
  const managerName: string = req.body.managerName;

  if (!managerName) {
    return res.status(400).send('Manager name is required');
  }
  const managerId = ''; // Manager socket ID will be added later

  // Allow max 100 sessions
  if (Object.keys(sessions).length >= 100) {
    return res.status(400).send('Maximum number of sessions reached');
  }

  const session = createNewSession(managerId, managerName);
  sessions[session.sessionId] = session;
  res.json({
    sessionId: session.sessionId,
    teamCodes: session.teamCodes,
    managerName
  });
});

io.on('connection', (socket: Socket) => {
  // Handle players joining the game
  socket.on('join-game', ({ teamCode, playerName }) => {
    if (typeof teamCode !== 'string' || typeof playerName !== 'string') {
      socket.emit('error', 'Invalid team code or player name');
      return;
    }

    const session = Object.values(sessions).find((session) =>
      session.teamCodes.includes(teamCode)
    );
    if (!session) {
      socket.emit('error', 'Invalid team code');
      return;
    }

    // Check for duplicate player name
    const isDuplicateName = session.players.some(
      (player) => player.name === playerName
    );
    if (isDuplicateName) {
      socket.emit('error', 'Player name already taken');
      return;
    }

    // First player joining should be the manager
    if (session.players.length === 0) {
      if (
        session.manager.name !== playerName ||
        session.manager.teamCode !== teamCode
      ) {
        socket.emit('error', 'Game manager must join the team 1 first.');
        return;
      }
      session.manager.id = socket.id;
    }

    // Count the number of players already in the team
    const playersInTeam = session.players.filter(
      (player) => player.teamCode === teamCode
    ).length;
    if (playersInTeam >= 2) {
      socket.emit('error', 'Team is full');
      return;
    }

    // Add player to the session with the provided name
    session.players.push({ id: socket.id, teamCode, name: playerName });
    socket.join(session.sessionId);
    // Notify the client that they have successfully joined the game
    socket.emit('joined-game', {
      sessionId: session.sessionId,
      playerName,
      teamCode
    });

    // Check if all teams are full (i.e., each team has 2 players)
    const allTeamsFull = session.teamCodes.every(
      (code) =>
        session.players.filter((player) => player.teamCode === code).length ===
        2
    );

    if (allTeamsFull) {
      io.to(session.sessionId).emit('all-players-joined', {
        team1: session.players.filter(
          (player) => player.teamCode === session.teamCodes[0]
        ),
        team2: session.players.filter(
          (player) => player.teamCode === session.teamCodes[1]
        )
      });
      // Randomly pick hakem and assign cards
      session.hakem = session.players[Math.floor(Math.random() * 4)];

      // Notify the clients who the hakem is and the game started
      io.to(session.sessionId).emit('game-started', {
        hakem: session.hakem
      });

      // generate a randomized deck of cards
      session.deck = generateDeck();
      // send five cards to the hakem to choose trump suit
      const hakemCards = session.deck.splice(0, 5);
      io.to(session.hakem.id).emit('hakem-cards', {
        cards: hakemCards
      });
    }
  });

  // Handle the hakem selecting the trump suit. Make sure only hakem can emit this event.
  socket.on('trump-suit', ({ suit }) => {
    const session = Object.values(sessions).find((session) =>
      session.players.some((player) => player.id === socket.id)
    );
    if (!session) {
      return;
    }

    if (session.hakem?.id !== socket.id) {
      return;
    }

    session.trumpSuit = suit;
    io.to(session.sessionId).emit('trump-suit-selected', {
      suit
    });
  });

  // Handle the player disconnecting from the game
  socket.on('disconnect', () => {
    const session = Object.values(sessions).find((session) =>
      session.players.some((player) => player.id === socket.id)
    );
    if (!session) {
      return;
    }

    const playerIndex = session.players.findIndex(
      (player) => player.id === socket.id
    );
    const player = session.players[playerIndex];
    session.players.splice(playerIndex, 1);

    // Notify the clients that the player has left the game
    io.to(session.sessionId).emit('player-left', {
      playerName: player.name
    });
  });
});

httpServer.listen(3000, () => {
  console.log('Server is running on port 3000');
});
