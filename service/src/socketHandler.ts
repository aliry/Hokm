import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameRuntime } from './gameRuntime';
import { GameEvent } from './constants';

export class SocketHandler {
  private io: SocketIOServer;
  private gameRuntime: GameRuntime;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.io = io;
    this.gameRuntime = new GameRuntime(gameSessionManager, io);
  }

  public handleConnection(socket: Socket): void {
    socket.on(GameEvent.JoinGame, ({ teamCode, playerName }) => {
      this.gameRuntime.joinGame(socket, teamCode, playerName);
    });

    socket.on(GameEvent.SetTrumpSuit, ({ suit }) => {
      this.gameRuntime.selectTrumpSuit(socket, suit);
    });

    socket.on(GameEvent.Disconnect, () => {
      this.gameRuntime.disconnect(socket);
    });
  }
}
