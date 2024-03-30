import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameSession } from './gameSession';
import {
  CardValues,
  GameAction,
  GameEvent,
  SocketEvents,
  Suits
} from './constants';
import { Card, ServerEventPayload } from './sharedTypes';

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
      throw new Error('Session not found');
    }

    session.addPlayer(playerName, teamCode, socket.id);

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
      this.startGame(session);
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
      throw new Error('Operation not allowed.');
    }

    trumpSuit = trumpSuit.toLowerCase();
    if (!Suits.includes(trumpSuit)) {
      throw new Error('Invalid trump suit');
    }

    session.TrumpSuit = trumpSuit;
    // Broadcast the selected trump suit to all sockets in the room.
    this.emitToSession(session, GameEvent.TrumpSuitSelected);

    this.distributeCards(session);
  }

  public playCard(socket: Socket, card: Card) {
    //#region Validation
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }

    // find the player index by socket id, if not found return error
    const playerIndex = session.Players.findIndex(
      (player) => player.Id === socket.id
    );
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    // Check if it's the player's turn.
    if (session.CurrentPlayerIndex !== playerIndex) {
      throw new Error("It's not your turn");
    }

    // Check if the player has the card in their hand and if it's a valid card.
    if (
      !session.Players[playerIndex].hasCard(card) ||
      !session.isCardValidForCurrentRound(card)
    ) {
      throw new Error('Invalid card');
    }
    //#endegion

    const player = session.Players[playerIndex];
    player.removeCard(card);

    // Broadcast the played card to all sockets in the room.
    this.emitToSession(session, GameEvent.CardPlayed, {
      playerId: socket.id,
      card
    });

    this.emitToPlayer(socket.id, session, GameEvent.CardPlayed);

    const trickItem = { playerIndex, card };
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

    // If all players have played a card, end the trick.
    if (
      session.CurrentRound.tricks[currentTrickIndex].items.length ===
      session.Players.length
    ) {
      this.endTrick(session);
    } else {
      // Move to the next player.
      session.CurrentPlayerIndex++;
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
    this.emitToPlayer(session.Hakem.Id, session, GameEvent.RoundStarted);

    // Other players get 13 cards. emit RoundStarted event.
    session.Players.forEach((player) => {
      if (player.Id === session.Hakem?.Id) {
        return;
      }

      const playerCards = session.Deck!.splice(0, 13);
      player.addCards(playerCards);
      this.emitToPlayer(player.Id, session, GameEvent.RoundStarted);
    });
  }

  private selectHakem(session: GameSession) {
    // Assign a random player as the hakem.
    const hakemIndex = Math.floor(Math.random() * session.Players.length);
    session.setHakemPlayerIndex(hakemIndex);

    // Broadcast to the room that the hakem has been selected.
    this.emitToSession(
      session,
      GameEvent.HakemSelected,
      session.Hakem?.getState()
    );

    if (session.Deck && session.Hakem) {
      const hakemCards = session.Deck.splice(0, 5);
      session.Players[hakemIndex].addCards(hakemCards);
      this.emitToPlayer(session.Hakem.Id, session, GameEvent.HakemCards);
    }
  }

  private startNewTrick(session: GameSession) {
    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }
    const lastTrickWinnerIndex =
      session.CurrentRound.tricks[session.CurrentRound.tricks.length - 1]
        .winnerIndex;
    if (lastTrickWinnerIndex === undefined) {
      throw new Error('Last trick winner not determined.');
    }

    session.CurrentPlayerIndex = lastTrickWinnerIndex;
    session.CurrentRound.tricks.push({ items: [] });

    this.emitToSession(session, GameEvent.TrickStarted);
  }

  private endTrick(session: GameSession) {
    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }
    // Determine the winner of the trick.
    const winnerIndex = this.determineTrickWinner(session);

    // Update the winner of the trick.
    session.CurrentRound.tricks[
      session.CurrentRound.tricks.length - 1
    ].winnerIndex = winnerIndex;

    // Broadcast to the room that the trick has ended.
    this.emitToSession(session, GameEvent.TrickEnded, {
      winner: session.Players[winnerIndex].getState()
    });

    if (session.checkIfRoundHasWinnerSoFar()) {
      this.endRound(session);
    } else {
      this.startNewTrick(session);
    }
  }

  private determineTrickWinner(session: GameSession): number {
    //#region Validation
    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }
    if (session.CurrentRound.tricks.length < session.Players.length) {
      throw new Error('Trick is not complete.');
    }
    //#endregion

    const currentTrick =
      session.CurrentRound.tricks[session.CurrentRound.tricks.length - 1];
    const trumpSuit = session.CurrentRound.trumpSuit;
    const trickItems = currentTrick.items;
    let winningCard = trickItems[0].card;
    let winningPlayerIndex = trickItems[0].playerIndex;
    for (let i = 1; i < trickItems.length; i++) {
      const card = trickItems[i].card;
      if (card.suit === trumpSuit && winningCard.suit !== trumpSuit) {
        winningCard = card;
        winningPlayerIndex = trickItems[i].playerIndex;
      } else if (
        card.suit === winningCard.suit &&
        CardValues.indexOf(card.value) > CardValues.indexOf(winningCard.value)
      ) {
        winningCard = card;
        winningPlayerIndex = trickItems[i].playerIndex;
      }
    }
    return winningPlayerIndex;
  }

  /**
   * Starts the game session.
   */
  public startGame(session: GameSession) {
    if (session.GameStarted) {
      throw new Error('Game has already started.');
    }
    session.GameStarted = true;
    this.startRound(session);
  }

  private startRound(session: GameSession) {
    if (!session.GameStarted) {
      throw new Error('Game has not started yet.');
    }

    // Initialize the round.
    session.StartNewRound();

    // Broadcast to the room that a new round has started.
    this.emitToSession(session, GameEvent.RoundStarted);

    this.selectHakem(session);
  }

  private endRound(session: GameSession) {
    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }
    session.EndRound();
    // Broadcast to the room that the round has ended.
    this.emitToSession(session, GameEvent.RoundEnded);
  }

  //#region emitters
  private emitToSession(
    session: GameSession,
    event: GameEvent,
    data?: unknown
  ) {
    const payLoad: ServerEventPayload = {
      event,
      data,
      gameState: session.getStateForBroadcast()
    };
    this.io.to(session.SessionId).emit(SocketEvents.ServerEvent, payLoad);
  }

  private emitToPlayer(
    playerId: string,
    session: GameSession,
    event: GameEvent
  ) {
    const payLoad: ServerEventPayload = {
      event,
      gameState: session.getStateForBroadcast(playerId)
    };
    this.io.to(playerId).emit(SocketEvents.ServerEvent, payLoad);
  }
  //#endregion
}
