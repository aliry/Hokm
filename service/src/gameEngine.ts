import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameSession } from './gameSession';
import { CardValues, GameEvent, SocketEvents, Suits } from './constants';
import { Card, Round, ServerEventPayload } from './sharedTypes';
import { GameConfigs } from './gameConfigs';

/*
 * The GameEngine class is responsible for managing the game logic.
 * It receives events from the clients and updates the game state accordingly.
 */
export class GameEngine {
  private gameSessionManager: GameSessionManager;

  constructor(gameSessionManager: GameSessionManager) {
    this.gameSessionManager = gameSessionManager;
  }

  /**
   * Joins a player to the game session.
   *
   * @param socket - The socket object representing the player's connection.
   * @param teamCode - The team code of the player.
   * @param playerName - The name of the player.
   * @returns The game session object.
   * @throws Error if the session is not found.
   */
  public JoinGame(
    socket: Socket,
    teamCode: string,
    playerName: string
  ): GameSession {
    const session = this.gameSessionManager.getGameSessionByTeamCode(teamCode);
    if (!session) {
      throw new Error('Session not found');
    }
    // Check if the player is already in the game session and reconnecting
    const playerIndex = session.Players.findIndex(
      (player) =>
        player.name === playerName &&
        player.teamCode === teamCode &&
        !player.connected
    );

    let isReconnecting = false;
    if (playerIndex !== -1) {
      // Reconnect the player.
      session.ReconnectPlayer(playerIndex, socket.id);
      isReconnecting = true;
    } else {
      session.AddPlayer(playerName, teamCode, socket.id);
    }

    // Join the socket to the room named after the session ID.
    socket.join(session.SessionId);

    if (!isReconnecting) {
      // Once all teams are full, we can start the game and select the hakem.
      const allTeamsFull = session.TeamCodes.every(
        (code) =>
          session.Players.filter((player) => player.teamCode === code)
            .length === 2
      );
      if (allTeamsFull) {
        this.StartNewRound(session);
      }
    }

    return session;
  }

  /**
   * Starts a new round in the game session.
   *
   * @param session - The game session object.
   * @throws Error if one or more players are not connected or if a round has already started.
   */
  public StartNewRound(session: GameSession) {
    // All players should be joined and connected
    if (
      session.Players.length !== GameConfigs.minPlayers ||
      session.Players.some((player) => !player.connected)
    ) {
      throw new Error('One or more players are not connected.');
    }

    if (session.CurrentRound) {
      throw new Error('Round has already started.');
    }

    // If there is previously selected hakem, then we need to see if their team is the hakem again.
    // If Hakem team lost the last round, then the hakem should be passed to the next player in the opposite team.
    let lastRound: Round | undefined;
    let hakemIndex: number | undefined;
    if (session.RoundHistory.length > 0) {
      lastRound = session.RoundHistory[session.RoundHistory.length - 1];
      if (
        lastRound.hakemIndex !== undefined &&
        lastRound.winnerTeam !== undefined
      ) {
        const hakemTeamCode = session.Players[lastRound.hakemIndex].teamCode;
        if (lastRound.winnerTeam === hakemTeamCode) {
          hakemIndex = lastRound.hakemIndex;
        } else {
          // If the hakem team lost the last round, pass the hakem to the next player in the opposite team.
          hakemIndex = (lastRound.hakemIndex + 1) % session.Players.length;
        }
      } else {
        throw new Error('Unexpected game state');
      }
    }

    // Initialize the round.
    session.StartNewRound();
    this.selectHakem(session, lastRound?.hakemIndex);
  }

  /**
   * Selects the trump suit for the game session.
   *
   * @param session - The game session.
   * @param socketId - The ID of the socket making the selection.
   * @param trumpSuit - The selected trump suit.
   * @throws Error if the operation is not allowed or the trump suit is invalid.
   */
  public SelectTrumpSuit(
    session: GameSession,
    socketId: string,
    trumpSuit: string
  ) {
    if (
      !session ||
      session.Hakem?.id !== socketId ||
      typeof trumpSuit !== 'string'
    ) {
      throw new Error('Operation not allowed.');
    }

    trumpSuit = trumpSuit.toLowerCase();
    if (!Suits.includes(trumpSuit)) {
      throw new Error('Invalid trump suit');
    }

    session.TrumpSuit = trumpSuit;

    this.distributeCards(session);
    this.startNewTrick(session);
  }

  /**
   * Plays a card in the game session.
   *
   * @param session - The game session.
   * @param socketId - The socket ID of the player.
   * @param card - The card to be played.
   * @throws {Error} If the round has not started yet, one or more players are not connected,
   * the player is not found, it's not the player's turn, or the card is invalid.
   */
  public PlayCard(session: GameSession, socketId: string, card: Card) {
    //#region Validation
    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }

    if (session.Players.some((player) => !player.connected)) {
      throw new Error('One or more players are not connected.');
    }

    // find the player index by socket id, if not found return error
    const playerIndex = session.Players.findIndex(
      (player) => player.id === socketId
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
   * @param session - The game session.
   * @param socketId - The ID of the socket associated with the player.
   */
  public Disconnect(session: GameSession, socketId: string) {
    const playerIndex = session.Players.findIndex(
      (player) => player.id === socketId
    );
    const player = session.Players[playerIndex];
    player.connected = false;
  }

  /**
   * Retrieves the game session associated with the provided socket.
   * @param socket - The socket object representing the player's connection.
   * @returns The game session associated with the socket.
   * @throws Error if the session is not found.
   */
  public GetSession(socket: Socket): GameSession {
    const session = this.gameSessionManager.getGameSessionByPlayerId(socket.id);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
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
      !session.Hakem.id ||
      !session.Hakem.cards ||
      !session.TrumpSuit
    ) {
      throw new Error('Operation not allowed.');
    }

    // check if all players are joined and connected
    if (
      session.Players.some(
        (player) => !player.connected || player.id === undefined
      )
    ) {
      throw new Error('Not all players are joined or connected.');
    }

    // Distribute the remaining cards to the players.
    // Hakem already has 5 cards so should get 8 more.
    const hakemRemainingCards = session.Deck.splice(0, 8);
    session.Hakem.cards.push(...hakemRemainingCards);

    // Other players get 13 cards. emit RoundStarted event.
    session.Players.forEach((player) => {
      if (player.id === session.Hakem?.id) {
        return;
      }
      if (!player.id) {
        throw new Error('Unexpected game state. Player ID is missing.');
      }
      const playerCards = session.Deck!.splice(0, 13);
      player.addCards(playerCards);
    });
  }

  private selectHakem(session: GameSession, hakemIndex?: number) {
    if (hakemIndex === undefined) {
      // Assign a random player as the hakem.
      hakemIndex = Math.floor(Math.random() * session.Players.length);
    }
    session.SetHakemPlayerIndex(hakemIndex);

    if (session.Deck && session.Hakem && session.Hakem.id) {
      const hakemCards = session.Deck.splice(0, 5);
      session.Players[hakemIndex].addCards(hakemCards);
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
  }

  private endTrick(session: GameSession) {
    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }
    // Determine the winner of the trick.
    const winnerIndex = this.determineTrickWinner(session);
    const winnerTeamCode = session.Players[winnerIndex].teamCode;

    // Update the winner of the trick.
    session.CurrentRound.tricks[
      session.CurrentRound.tricks.length - 1
    ].winnerIndex = winnerIndex;

    session.CurrentRound.score[winnerTeamCode] += 1;

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

  private endRound(session: GameSession) {
    if (!session.CurrentRound) {
      throw new Error('Round has not started yet.');
    }
    session.EndRound();
  }
}
