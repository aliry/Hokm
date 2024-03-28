import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameSession } from './gameSession';
import { GameEvent, Suits } from './constants';

export class GameRuntime {
  private gameSessionManager: GameSessionManager;
  private io: SocketIOServer;

  constructor(gameSessionManager: GameSessionManager, io: SocketIOServer) {
    this.gameSessionManager = gameSessionManager;
    this.io = io;
  }

  public joinGame(socket: Socket, teamCode: string, playerName: string) {
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

  public selectTrumpSuit(socket: Socket, trumpSuit: string) {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (
      !session ||
      session.Hakem?.Id !== socket.id ||
      session.TrumpSuit ||
      typeof trumpSuit !== 'string'
    ) {
      socket.emit(GameEvent.Error, 'Invalid operation');
      return;
    }

    trumpSuit = trumpSuit.toLowerCase();
    if (!Suits.includes(trumpSuit)) {
      socket.emit(GameEvent.Error, 'Invalid suit');
      return;
    }

    session.TrumpSuit = trumpSuit;
    // Broadcast the selected trump suit to all sockets in the room.
    this.io
      .to(session.SessionId)
      .emit(GameEvent.TrumpSuitSelected, { trumpSuit });

    this.startRound(session);
  }

  public disconnect(socket: Socket) {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (!session) {
      return;
    }

    const playerIndex = session.Players.findIndex(
      (player) => player.Id === socket.id
    );
    const player = session.Players[playerIndex];
    player.Connected = false;

    socket.to(session.SessionId).emit(GameEvent.PlayerLeft, player.toJSON());
  }

  private startRound(session: GameSession) {
    if (
      !session.Deck ||
      !session.Hakem ||
      !session.Hakem.Cards ||
      !session.TrumpSuit
    ) {
      throw new Error('Operation not allowed.');
    }

    // Distribute the remaining cards to the players.
    // Hakem already has 5 cards so should get 8 more.
    const hakemRemainingCards = session.Deck.splice(0, 8);
    session.Hakem.Cards.push(...hakemRemainingCards);
    this.io
      .to(session.Hakem.Id)
      .emit(GameEvent.RoundStarted, hakemRemainingCards);

    // Other players get 13 cards. emit RoundStarted event.
    session.Players.forEach((player) => {
      if (player.Id === session.Hakem?.Id) {
        return;
      }

      const playerCards = session.Deck!.splice(0, 13);
      player.addCards(playerCards);
      this.io.to(player.Id).emit(GameEvent.RoundStarted, playerCards);
    });
  }

  private checkAllPlayersJoined(session: GameSession) {
    const allTeamsFull = session.TeamCodes.every(
      (code) =>
        session.Players.filter((player) => player.TeamCode === code).length ===
        2
    );

    if (allTeamsFull) {
      this.selectHakem(session);
    }
  }

  private selectHakem(session: GameSession) {
    // Assign a random player as the hakem.
    const hakemIndex = Math.floor(Math.random() * session.Players.length);
    session.setHakemPlayerIndex(hakemIndex);

    // Broadcast to the room that the hakem has been selected.
    this.io
      .to(session.SessionId)
      .emit(GameEvent.HakemSelected, session.Hakem?.toJSON());

    if (session.Deck && session.Hakem) {
      const hakemCards = session.Deck.splice(0, 5);
      this.io.to(session.Hakem.Id).emit(GameEvent.HakemCards, hakemCards);
      session.Players[hakemIndex].addCards(hakemCards);
    }
  }
}
