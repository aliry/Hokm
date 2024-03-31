import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameEngine } from './gameEngine';
import { GameAction, GameEvent, SocketEvents } from './constants';
import { ClientActionPayload, ServerEventPayload } from './sharedTypes';

export class SocketHandler {
  private gameEngine: GameEngine;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.gameEngine = new GameEngine(gameSessionManager, io);
  }

  public handleConnection(socket: Socket): void {
    socket.on(SocketEvents.ClientAction, (payload: ClientActionPayload) => {
      try {
        const { action, data } = payload;
        switch (action) {
          case GameAction.JoinGame:
            const { teamCode, playerName } = data;
            this.gameEngine.JoinGame(socket, teamCode, playerName);
            break;
          case GameAction.SelectTrumpSuit:
            const { trumpSuit } = data;
            this.gameEngine.SelectTrumpSuit(socket, trumpSuit);
            break;
          case GameAction.PlayCard:
            const { card } = data;
            this.gameEngine.PlayCard(socket, card);
            break;
          case GameAction.Disconnect:
            this.gameEngine.Disconnect(socket);
            break;
          default:
            this.emitError(socket, 'Invalid action');
            break;
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
    socket.on('disconnect', () => {
      this.gameEngine.Disconnect(socket);
    });
  }

  public emitError(socket: Socket, message: string): void {
    const payLoad = {
      event: GameEvent.Error,
      data: message
    };
    socket.emit(SocketEvents.ServerEvent, payLoad);
  }
}
