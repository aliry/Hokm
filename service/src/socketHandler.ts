import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameRuntime } from './gameRuntime';
import { GameAction, GameEvent, SocketEvents } from './constants';
import { ClientActionPayload } from './sharedTypes';

export class SocketHandler {
  private gameRuntime: GameRuntime;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this.gameRuntime = new GameRuntime(gameSessionManager, io);
  }

  public handleConnection(socket: Socket): void {
    socket.on(SocketEvents.ClientAction, (payload: ClientActionPayload) => {
      try {
        const { action, data } = payload;
        switch (action) {
          case GameAction.JoinGame:
            const { teamCode, playerName } = data;
            this.gameRuntime.joinGame(socket, teamCode, playerName);
            break;
          case GameAction.SelectTrumpSuit:
            const { trumpSuit } = data;
            this.gameRuntime.selectTrumpSuit(socket, trumpSuit);
            break;
          case GameAction.PlayCard:
            const { card } = data;
            this.gameRuntime.playCard(socket, card);
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
    socket.on('disconnect', () => {
      this.gameRuntime.disconnect(socket);
    });
  }

  public emitError(socket: Socket, message: string): void {
    socket.emit(GameEvent.Error, { message });
  }
}
