import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameSession } from './gameSession';
import { GameAction, GameEvent, SocketEvents, Suits } from './constants';
import { Card, ServerEventPayload } from './types';

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
    this.emitToSession(session, GameEvent.PlayerJoined);

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
    this.emitToSession(session, GameEvent.TrumpSuitSelected, { trumpSuit });

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

    // Check if the player has the card in their hand and if it's a valid card.
    if (
      !session.Players[playerIndex].hasCard(card) ||
      !session.isCardValidForCurrentRound(card)
    ) {
      this.emitError(socket, 'Invalid card');
      return;
    }

    // Broadcast the played card to all sockets in the room.
    this.emitToSession(session, GameEvent.CardPlayed, {
      playerId: socket.id,
      card
    });

    const player = session.Players[playerIndex];
    player.removeCard(card);

    const trickItem = { player, card };
    const currentTrickIndex = session.CurrentRound.tricks.length - 1;
    if (currentTrickIndex < 0) {
      // Start a new trick.
      session.CurrentRound.tricks.push({
        items: [trickItem]
      });
    } else {
      // Add the played card to the current trick.
      session.CurrentRound.tricks[currentTrickIndex].items.push(trickItem);
    }

    // Move to the next player.
    session.CurrentPlayerIndex =
      (session.CurrentPlayerIndex + 1) % session.Players.length;

    // If all players have played a card, end the trick.
    if (
      session.CurrentRound.tricks[currentTrickIndex].items.length ===
      session.Players.length
    ) {
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

    this.emitToSession(session, GameEvent.PlayerLeft, player.getState());
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
    this.emitToPlayer(session.Hakem.Id, session, GameEvent.RoundStarted, hakemRemainingCards);

    // Other players get 13 cards. emit RoundStarted event.
    session.Players.forEach((player) => {
      if (player.Id === session.Hakem?.Id) {
        return;
      }

      const playerCards = session.Deck!.splice(0, 13);
      player.addCards(playerCards);
      this.emitToPlayer(player.Id, session, GameEvent.RoundStarted, playerCards);
    });
  }

  private selectHakem(session: GameSession) {
    // Assign a random player as the hakem.
    const hakemIndex = Math.floor(Math.random() * session.Players.length);
    session.setHakemPlayerIndex(hakemIndex);

    // Broadcast to the room that the hakem has been selected.
    this.emitToSession(session, GameEvent.HakemSelected, session.Hakem?.getState());

    if (session.Deck && session.Hakem) {
      const hakemCards = session.Deck.splice(0, 5);
      this.emitToPlayer(session.Hakem.Id, session, GameEvent.HakemCards, hakemCards);
      session.Players[hakemIndex].addCards(hakemCards);
    }
  }

  private endTrick(session: GameSession) {
    // Determine the winner of the trick.
    const winner = session.determineTrickWinner();

    // Broadcast to the room that the trick has ended.
    this.emitToSession(session, GameEvent.TrickEnded, {
      winner: winner?.getState()
    });

    if (session.checkIfRoundHasWinnerSoFar()) {
      this.endRound(session);
    }
  }

  private endRound(session: GameSession) {
    // Broadcast to the room that the round has ended.
    this.emitToSession(session, GameEvent.RoundEnded, session.stateForBroadcast);

    // If the game has ended, broadcast the final scores.
    if (session.GameEnded) {
      this.emitToSession(session, GameEvent.GameEnded, session.stateForBroadcast);
    } else {
      // Start a new round.
      session.startNewRound();
      this.selectHakem(session);
    }
  }

  private emitError(socket: Socket, message: string): void {
    socket.emit(GameEvent.Error, { message });
  }

  private emitToSession(session: GameSession, event: GameEvent, data?: unknown) {
    const payLoad: ServerEventPayload = { event, data, gameState: session.stateForBroadcast };
    this.io.to(session.SessionId).emit(event, data);
  }

  private emitToPlayer(playerId: string, session: GameSession, event: GameEvent, data?: unknown) {
    const payLoad: ServerEventPayload = { event, data, gameState: session.stateForBroadcast };
    this.io.to(playerId).emit(event, payLoad);
  }
}
