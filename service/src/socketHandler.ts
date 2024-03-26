import { Player } from "./types";
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from "./gameSessionManager";

export class SocketHandler {
  private io: SocketIOServer;
  private gameSessionManager: GameSessionManager;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.io = io;
    this.gameSessionManager = gameSessionManager;
  }

  public handleConnection(socket: Socket): void {
    socket.on('join-game', ({ teamCode, playerName }: { teamCode: string, playerName: string }) => {
      if (typeof teamCode !== 'string' || typeof playerName !== 'string') {
        socket.emit('error', 'Invalid team code or player name');
        return;
      }

      const session = this.gameSessionManager.getGameSessionByTeamCode(teamCode);
      if (!session) {
        socket.emit('error', 'Invalid team code');
        return;
      }

      let newPlayer: Player;
      try {
        newPlayer = session.addPlayer(playerName, teamCode, socket.id);
      } catch (error: any) {
        socket.emit('error', error.message);
        return;
      }

      socket.join(session.SessionId);
      socket.emit('joined-game', {
        sessionId: session.SessionId,
        newPlayer
      });

      const allTeamsFull = session.TeamCodes.every(
        (code) =>
          session.Players.filter((player) => player.teamCode === code).length === 2
      );

      if (allTeamsFull) {
        this.io.to(session.SessionId).emit('all-players-joined', {
          team1: session.Players.filter(
            (player) => player.teamCode === session.TeamCodes[0]
          ),
          team2: session.Players.filter(
            (player) => player.teamCode === session.TeamCodes[1]
          )
        });

        session.Hakem = session.Players[Math.floor(Math.random() * 4)];

        this.io.to(session.SessionId).emit('game-started', {
          hakem: session.Hakem
        });

        // session.Deck = generateShuffledDeck();
        const hakemCards = session.Deck.splice(0, 5);
        this.io.to(session.Hakem.id).emit('hakem-cards', {
          cards: hakemCards
        });
      }
    });

    socket.on('select-trump-suit', ({ suit }: { suit: string }) => {
      const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
      if (!session || session.Hakem?.id !== socket.id) {
        return;
      }

      session.TrumpSuit = suit;
      this.io.to(session.SessionId).emit('trump-suit-selected', {
        suit
      });
    });

    socket.on('disconnect', () => {
      const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
      if (!session) {
        return;
      }

      const playerIndex = session.Players.findIndex(
        (player) => player.id === socket.id
      );
      const player = session.Players[playerIndex];
      session.Players.splice(playerIndex, 1);

      this.io.to(session.SessionId).emit('player-left', {
        playerName: player.name
      });
    });
  }
}