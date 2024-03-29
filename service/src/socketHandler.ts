import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameRuntime } from './gameRuntime';
import { GameAction, GameEvent } from './constants';

export class SocketHandler {
  private gameRuntime: GameRuntime;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.gameRuntime = new GameRuntime(gameSessionManager, io);
  }

  public handleConnection(socket: Socket): void {
    socket.on(GameAction.JoinGame, ({ teamCode, playerName }) => {
      try {
        this.gameRuntime.joinGame(socket, teamCode, playerName);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });

    socket.on(GameAction.SelectTrumpSuit, ({ suit }) => {
      try {
        this.gameRuntime.selectTrumpSuit(socket, suit);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });

    socket.on(GameEvent.Disconnect, () => {
      try {
        this.gameRuntime.disconnect(socket);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  public emitError(socket: Socket, message: string): void {
    socket.emit(GameEvent.Error, { message });
  }
}
