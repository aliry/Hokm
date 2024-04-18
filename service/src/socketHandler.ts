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
    gameSessionManager.registerSessionTimeoutListener((session) => {
      this._io.to(session.SessionId).emit(SocketEvents.ServerEvent, {
        event: GameEvent.SessionTimeout
      });
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
              this.emitGameState(session);
              break;
            case GameAction.Disconnect:
              this.gameEngine.Disconnect(session, socket.id);
              break;
            default:
              this.emitError(socket, 'Invalid action');
              break;
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
    const playerIds = session.Players.map((player) => player.id || '');
    playerIds.forEach((playerId) => {
      if (playerId) {
        const payLoad: ServerEventPayload = {
          event: GameEvent.GameState,
          gameState: session.GetStateForBroadcast(playerId)
        };
        this._io.to(playerId).emit(SocketEvents.ServerEvent, payLoad);
      }
    });
  }
}
