import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameSession } from './gameSession';
import { GameEvent } from './constants';

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
      socket.emit(GameEvent.Error, 'Invalid team code');
      return;
    }

    let newPlayer;
    try {
      newPlayer = session.addPlayer(playerName, teamCode, socket.id);
    } catch (error: any) {
      socket.emit(GameEvent.Error, error.message);
      return;
    }

    // Join the socket to the room named after the session ID.
    socket.join(session.SessionId);

    // Broadcast to the room that a new player has joined.
    this.io
      .to(session.SessionId)
      .emit(GameEvent.PlayerJoined, session.stateForBroadcast);

    this.checkAllPlayersJoined(session);
  }

  selectTrumpSuit(socket: Socket, suit: string) {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (!session || session.Hakem?.id !== socket.id) {
      socket.emit(GameEvent.Error, 'Invalid operation');
      return;
    }

    session.TrumpSuit = suit;

    // Broadcast the selected trump suit to all sockets in the room.
    this.io.to(session.SessionId).emit(GameEvent.TrumpSuitSelected, {
      suit
    });
  }

  disconnect(socket: Socket) {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (!session) {
      return;
    }

    const playerIndex = session.Players.findIndex(
      (player) => player.id === socket.id
    );
    const player = session.Players[playerIndex];
    session.Players.splice(playerIndex, 1);

    socket.to(session.SessionId).emit(GameEvent.PlayerLeft, {
      playerName: player.name
    });
  }

  checkAllPlayersJoined(session: GameSession) {
    const allTeamsFull = session.TeamCodes.every(
      (code) =>
        session.Players.filter((player) => player.teamCode === code).length ===
        2
    );

    if (allTeamsFull) {
      // Assign a random player as the hakem.
      const hakemIndex = Math.floor(Math.random() * session.Players.length);
      session.Hakem = session.Players[hakemIndex];

      // Broadcast to the room that the hakem has been selected.
      this.io.to(session.SessionId).emit(GameEvent.HakemSelected, {
        hakem: session.Hakem
      });

      if (session.Deck) {
        const hakemCards = session.Deck.splice(0, 5);
        this.io.to(session.Hakem.id).emit(GameEvent.HakemCards, {
          cards: hakemCards
        });
      }
    }
  }
}
