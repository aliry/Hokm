import { Player } from "./types";
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from "./gameSessionManager";
import { GameRuntime } from "./gameRuntime";

export class SocketHandler {
  private io: SocketIOServer;
  private gameRuntime: GameRuntime;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.io = io;
    this.gameRuntime = new GameRuntime(gameSessionManager, io);
  }

  public handleConnection(socket: Socket): void {
    socket.on('join-game', ({ teamCode, playerName }) => {
      this.gameRuntime.joinGame(socket, teamCode, playerName);
    });

    socket.on('select-trump-suit', ({ suit }) => {
      this.gameRuntime.selectTrumpSuit(socket, suit);
    });

    socket.on('disconnect', () => {
      this.gameRuntime.disconnect(socket);
    });
  }
}