import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameSession } from './gameSession';
import { GameAction, GameEvent, Suits } from './constants';
import { Card } from './types';

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
      this.emitError(socket, 'Invalid team code');
      return;
    }

    try {
      session.addPlayer(playerName, teamCode, socket.id);
    } catch (error: any) {
      this.emitError(socket, error.message);
      return;
    }

    // Join the socket to the room named after the session ID.
    socket.join(session.SessionId);

    // Broadcast to the room that a new player has joined.
    this.io
      .to(session.SessionId)
      .emit(GameEvent.PlayerJoined, session.stateForBroadcast);

    // Once all teams are full, we can start the game and select the hakem.
    const allTeamsFull = session.TeamCodes.every(
      (code) =>
        session.Players.filter((player) => player.TeamCode === code).length ===
        2
    );
    if (allTeamsFull) {
      session.startGame();
      this.selectHakem(session);
    }
  }

  public selectTrumpSuit(socket: Socket, trumpSuit: string) {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (
      !session ||
      session.Hakem?.Id !== socket.id ||
      typeof trumpSuit !== 'string'
    ) {
      this.emitError(socket, 'Invalid operation');
      return;
    }

    trumpSuit = trumpSuit.toLowerCase();
    if (!Suits.includes(trumpSuit)) {
      this.emitError(socket, 'Invalid suit');
      return;
    }

    session.TrumpSuit = trumpSuit;
    // Broadcast the selected trump suit to all sockets in the room.
    this.io
      .to(session.SessionId)
      .emit(GameEvent.TrumpSuitSelected, { trumpSuit });

    this.distributeCards(session);
  }

  public cardPlayed(socket: Socket, sessionId: string, card: Card) {
    const session = this.gameSessionManager.getGameSession(sessionId);
    if (!session) {
      this.emitError(socket, 'Invalid session ID');
      return;
    }

    if (!session.CurrentRound) {
      this.emitError(socket, 'Round not started');
      return;
    }

    // find the player index by socket id, if not found return error
    const playerIndex = session.Players.findIndex(
      (player) => player.Id === socket.id
    );
    if (playerIndex === -1) {
      this.emitError(socket, 'Invalid player');
      return;
    }

    // Check if it's the player's turn.
    if (session.CurrentPlayerIndex !== playerIndex) {
      this.emitError(socket, 'Not your turn');
      return;
    }

    // Broadcast the played card to all sockets in the room.
    this.io.to(session.SessionId).emit(GameAction.CardPlayed, {
      playerId: socket.id,
      card
    });

    const player = session.Players[playerIndex];
    player.removeCard(card);

    const trickItem = { player, card };
    const currentTrickIndex = session.CurrentRound.tricks.length - 1;
    if (currentTrickIndex < 0) {
      // Start a new trick.
      session.CurrentRound.tricks.push([trickItem]);
    } else {
      // Add the played card to the current trick.
      session.CurrentRound.tricks[currentTrickIndex].push(trickItem);
    }

    // Move to the next player.
    session.CurrentPlayerIndex = (session.CurrentPlayerIndex + 1) % 4;

    // If all players have played a card, end the trick.
    if (session.CurrentRound.tricks[currentTrickIndex].length === 4) {
      this.endTrick(session);
    }
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

  private distributeCards(session: GameSession) {
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

  private endTrick(session: GameSession) {
    // Determine the winner of the trick.
    const winner = session.determineTrickWinner();

    // Broadcast to the room that the trick has ended.
    this.io.to(session.SessionId).emit(GameEvent.TrickEnded, {
      winner: winner?.toJSON()
    });

    // If all cards have been played, end the round.
    if (session.Players.every((player) => player.Cards.length === 0)) {
      this.endRound(session);
    }
  }

  private endRound(session: GameSession) {
    // Calculate the scores for the round.
    session.calculateRoundScores();

    // Broadcast to the room that the round has ended.
    this.io
      .to(session.SessionId)
      .emit(GameEvent.RoundEnded, session.stateForBroadcast);

    // If the game has ended, broadcast the final scores.
    if (session.GameOver) {
      this.io
        .to(session.SessionId)
        .emit(GameEvent.GameEnded, session.stateForBroadcast);
    } else {
      // Start a new round.
      session.startRound();
      this.selectHakem(session);
    }
  }

  private emitError(socket: Socket, message: string): void {
    socket.emit(GameEvent.Error, { message });
  }
}
