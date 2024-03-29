import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameRuntime } from './gameRuntime';
import { GameAction, GameEvent, SocketEvents } from './constants';
import { ClientActionPayload } from './types';

export class SocketHandler {
  private gameRuntime: GameRuntime;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.gameRuntime = new GameRuntime(gameSessionManager, io);
  }

  public handleConnection(socket: Socket): void {
    socket.on(SocketEvents.clientAction, (payload: ClientActionPayload) => {
      try {
        const { action } = payload;
        switch (action) {
          case GameAction.JoinGame:
            const { teamCode, playerName } = payload.data;
            this.gameRuntime.joinGame(socket, teamCode, playerName);
            break;
          case GameAction.SelectTrumpSuit:
            const { suit } = payload.data;
            this.gameRuntime.selectTrumpSuit(socket, suit);
            break;
          case GameAction.Disconnect:
            this.gameRuntime.disconnect(socket);
            break;
          default:
            this.emitError(socket, 'Invalid action');
            break;
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  public emitError(socket: Socket, message: string): void {
    socket.emit(GameEvent.Error, { message });
  }
}
