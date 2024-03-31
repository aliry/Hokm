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

/*
 * The GameEngine class is responsible for managing the game logic.
 * It receives events from the clients and updates the game state accordingly.
 */
export class GameEngine {
  private gameSessionManager: GameSessionManager;
  private io: SocketIOServer;

  constructor(gameSessionManager: GameSessionManager, io: SocketIOServer) {
    this.gameSessionManager = gameSessionManager;
    this.io = io;
  }

  /**
   * Joins a player to a game session.
   *
   * @param socket - The socket object representing the player's connection.
   * @param teamCode - The team code of the player.
   * @param playerName - The name of the player.
   * @throws Error if the session is not found.
   */
  public JoinGame(socket: Socket, teamCode: string, playerName: string) {
    const session = this.gameSessionManager.getGameSessionByTeamCode(teamCode);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if the player is already in the game session and reconnecting
    const playerIndex = session.Players.findIndex(
      (player) =>
        player.Name === playerName &&
        player.TeamCode === teamCode &&
        !player.Connected
    );
    if (playerIndex !== -1) {
      // Reconnect the player.
      session.ReconnectPlayer(playerIndex, socket.id);
      this.emitToPlayer(socket.id, session, GameEvent.GameState);
    } else {
      session.AddPlayer(playerName, teamCode, socket.id);
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
      this.startGame(session);
      this.startRound(session);
    }
  }

  /**
   * Selects the trump suit for the game session.
   *
   * @param socket - The socket object representing the player.
   * @param trumpSuit - The selected trump suit.
   * @throws Error if the operation is not allowed or the trump suit is invalid.
   */
  public SelectTrumpSuit(socket: Socket, trumpSuit: string) {
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
    this.startNewTrick(session);
  }

  /**
   * Plays a card for the specified player.
   *
   * @param {Socket} socket - The socket of the player.
   * @param {Card} card - The card to be played.
   * @throws {Error} If the session is not found, the round has not started yet, the player is not found, it's not the player's turn, or the card is invalid.
   */
  public PlayCard(socket: Socket, card: Card) {
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
      !this.isCardValidForCurrentRound(session, card)
    ) {
      throw new Error('Invalid card');
    }
    //#endregion

    const player = session.Players[playerIndex];
    player.removeCard(card);

    // Broadcast the played card to all sockets in the room.
    this.emitToSession(session, GameEvent.CardPlayed, {
      playerId: socket.id,
      card
    });

    this.emitToPlayer(socket.id, session, GameEvent.CardPlayed);

    const trickItem = { playerIndex, card };
    let currentTrickIndex = session.CurrentRound.tricks.length - 1;
    if (currentTrickIndex < 0) {
      // Start a new trick.
      session.CurrentRound.tricks.push({
        items: [trickItem]
      });
      currentTrickIndex = 0;
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
      session.CurrentPlayerIndex =
        (session.CurrentPlayerIndex + 1) % session.Players.length;
    }
  }

  /**
   * Disconnects a player from the game session.
   * @param socket - The socket representing the player's connection.
   */
  public Disconnect(socket: Socket) {
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

  /**
   * Checks if a card is valid for the current round.
   * @param {Card} card - The card to be checked.
   * @returns {boolean} - Returns true if the card is valid, false otherwise.
   * @throws {Error} - Throws an error if the round has not started yet.
   */
  private isCardValidForCurrentRound(session: GameSession, card: Card) {
    const round = session.CurrentRound;
    if (!round || session.CurrentPlayerIndex === undefined) {
      throw new Error('Round has not started yet.');
    }

    const currentTrickItems = round.tricks[round.tricks.length - 1].items;

    // if its the first trick of the round, any card is valid else check if the card is valid
    if (currentTrickItems.length === 0) {
      return true;
    }
    const firstCard = currentTrickItems[0].card;
    const player = session.Players[session.CurrentPlayerIndex];
    // if the player has a card of the first card's suit, they must play a card of that suit
    if (card.suit !== firstCard.suit && player.hasSuit(firstCard.suit)) {
      return false;
    }

    return true;
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
    session.SetHakemPlayerIndex(hakemIndex);

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

    const currentRoundTricks = session.CurrentRound.tricks;

    if (currentRoundTricks.length > 0) {
      const lastTrickWinnerIndex =
        currentRoundTricks[currentRoundTricks.length - 1].winnerIndex;
      if (lastTrickWinnerIndex === undefined) {
        throw new Error('Last trick winner not determined.');
      }
      session.CurrentPlayerIndex = lastTrickWinnerIndex;
    }

    currentRoundTricks.push({ items: [] });
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

    if (session.CheckIfRoundHasWinnerSoFar()) {
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
    const trickItems =
      session.CurrentRound.tricks[session.CurrentRound.tricks.length - 1].items;
    if (trickItems.length !== session.Players.length) {
      throw new Error('Trick is not complete.');
    }
    //#endregion

    const trumpSuit = session.CurrentRound.trumpSuit;
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

  private startGame(session: GameSession) {
    if (session.GameStarted) {
      throw new Error('Game has already started.');
    }
    session.GameStarted = true;
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
      gameState: session.GetStateForBroadcast()
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
      gameState: session.GetStateForBroadcast(playerId)
    };
    this.io.to(playerId).emit(SocketEvents.ServerEvent, payLoad);
  }
  //#endregion
}
