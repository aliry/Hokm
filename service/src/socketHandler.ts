import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameEngine } from './gameEngine';
import { GameAction, GameEvent, SocketEvents } from './constants';
import { ClientActionPayload, ServerEventPayload } from './sharedTypes';
import { GameSession } from './gameSession';

export class SocketHandler {
  private gameEngine: GameEngine;
  private _io: SocketIOServer;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this._io = io;
    this.gameEngine = new GameEngine(gameSessionManager, this.emitGameState.bind(this));
    gameSessionManager.registerSessionTimeoutListener((sessionId) => {
      const session = gameSessionManager.getGameSession(sessionId);
      if (session) {
        this.emitSessionTimeout(session); //TODO: this breaks the socket.io server. need to fix
      }
    });
  }

  public handleConnection(socket: Socket): void {
    socket.on(SocketEvents.ClientAction, (payload: ClientActionPayload) => {
      try {
        const { action, data } = payload;
        let session: GameSession;
        if (action === GameAction.JoinGame) {
          const { teamCode, playerName } = data;
          session = this.gameEngine.JoinGame(socket, teamCode, playerName);
        } else {
          session = this.gameEngine.GetSession(socket);
          switch (action) {
            case GameAction.StartNewRound:
              this.gameEngine.StartNewRound(session);
              break;
            case GameAction.SelectTrumpSuit:
              const { trumpSuit } = data;
              this.gameEngine.SelectTrumpSuit(session, socket.id, trumpSuit);
              break;
            case GameAction.PlayCard:
              const { card } = data;
              this.gameEngine.PlayCard(session, socket.id, card);
              break;
            case GameAction.GameState:
              // Do nothing, just emit the game state
              break;
            case GameAction.Disconnect:
              this.gameEngine.Disconnect(session, socket.id);
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
        }
        this.emitGameState(session);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });

    socket.on('disconnect', () => {
      try {
        const session = this.gameEngine.GetSession(socket);
        this.gameEngine.Disconnect(session, socket.id);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private emitError(socket: Socket, message: string): void {
    const payLoad = {
      event: GameEvent.Error,
      error: message
    };
    socket.emit(SocketEvents.ServerEvent, payLoad);
  }

  private emitGameState(session: GameSession) {
    session.Players.forEach((player) => {
      if (player.id) {
        const payLoad: ServerEventPayload = {
          event: GameEvent.GameState,
          gameState: session.GetStateForBroadcast(player.id)
        };
        this._io.to(player.id).emit(SocketEvents.ServerEvent, payLoad);
      }
    });
  }

  private emitSessionTimeout(session: GameSession) {
    session.Players.forEach((player) => {
      if (player.id) {
        const payLoad = {
          event: GameEvent.SessionTimeout
        };
        this._io.to(player.id).emit(SocketEvents.ServerEvent, payLoad);
      }
    });
  }
}

