import { Socket, Server as SocketIOServer } from "socket.io";
import { GameSessionManager } from "./gameSessionManager";
import { GameSession } from "./gameSession";

export class GameRuntime {
  private gameSessionManager: GameSessionManager;
  private io: SocketIOServer;

  constructor(gameSessionManager: GameSessionManager, io: SocketIOServer) {
    this.gameSessionManager = gameSessionManager;
    this.io = io;
  }

  joinGame(socket: Socket, teamCode: string, playerName: string) {
    const session = this.gameSessionManager.getGameSessionByTeamCode(teamCode);
    if (!session) {
      socket.emit('error', 'Invalid team code');
      return;
    }

    let newPlayer;
    try {
      newPlayer = session.addPlayer(playerName, teamCode, socket.id);
    } catch (error: any) {
      socket.emit('error', error.message);
      return;
    }

    // Join the socket to the room named after the session ID.  
    socket.join(session.SessionId);

    socket.emit('joined-game', {
      sessionId: session.SessionId,
      newPlayer
    });

    // Broadcast to the room that a new player has joined.  
    this.io.to(session.SessionId).emit('player-joined', {
      player: newPlayer
    });

    this.checkAllPlayersJoined(session);
  }

  selectTrumpSuit(socket: Socket, suit: string) {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (!session || session.Hakem?.id !== socket.id) {
      socket.emit('error', 'Invalid operation');
      return;
    }

    session.TrumpSuit = suit;

    // Broadcast the selected trump suit to all sockets in the room.  
    this.io.to(session.SessionId).emit('trump-suit-selected', {
      suit
    });
  }

  disconnect(socket: Socket) {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (!session) {
      return;
    }

    const playerIndex = session.Players.findIndex(player => player.id === socket.id);
    const player = session.Players[playerIndex];
    session.Players.splice(playerIndex, 1);

    socket.to(session.SessionId).emit('player-left', {
      playerName: player.name
    });
  }

  checkAllPlayersJoined(session: GameSession) {
    const allTeamsFull = session.TeamCodes.every(
      code => session.Players.filter(player => player.teamCode === code).length === 2
    );

    if (allTeamsFull) {
      // Broadcast to all sockets in the room that all players have joined.  
      this.io.to(session.SessionId).emit('all-players-joined', {
        team1: session.Players.filter(player => player.teamCode === session.TeamCodes[0]),
        team2: session.Players.filter(player => player.teamCode === session.TeamCodes[1])
      });

      if (session.Deck && session.Hakem) {
        const hakemCards = session.Deck.splice(0, 5);
        this.io.to(session.Hakem.id).emit('hakem-cards', {
          cards: hakemCards
        });
      }
    }
  }
}  