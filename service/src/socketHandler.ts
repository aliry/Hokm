import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameRuntime } from './gameRuntime';
import { GameEvent } from './constants';

export class SocketHandler {
  private gameRuntime: GameRuntime;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.gameRuntime = new GameRuntime(gameSessionManager, io);
  }

  public handleConnection(socket: Socket): void {
    socket.on(GameEvent.JoinGame, ({ teamCode, playerName }) => {
      try {
        this.gameRuntime.joinGame(socket, teamCode, playerName);
      } catch (error: any) {
        socket.emit(GameEvent.Error, { message: error.message });
      }
    });

    socket.on(GameEvent.SetTrumpSuit, ({ suit }) => {
      try {
        this.gameRuntime.selectTrumpSuit(socket, suit);
      } catch (error: any) {
        socket.emit(GameEvent.Error, { message: error.message });
      }
    });

    socket.on(GameEvent.Disconnect, () => {
      try {
        this.gameRuntime.disconnect(socket);
      } catch (error: any) {
        socket.emit(GameEvent.Error, { message: error.message });
      }
    });
  }
}
