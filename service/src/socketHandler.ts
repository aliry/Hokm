import { Socket, Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './gameSessionManager';
import { GameEngine } from './gameEngine';
import { GameAction, GameEvent, SocketEvents } from './constants';
import { ClientActionPayload, ServerEventPayload } from './sharedTypes';
import { GameSession } from './gameSession';
import { aiClient } from './appInsight';
import { response } from 'express';

export class SocketHandler {
  private gameEngine: GameEngine;
  private _io: SocketIOServer;
  private _gameSessionManager: GameSessionManager;

  constructor(io: SocketIOServer, gameSessionManager: GameSessionManager) {
    this._io = io;
    this._gameSessionManager = gameSessionManager;
    this.gameEngine = new GameEngine(
      gameSessionManager,
      this.emitGameState.bind(this)
    );
    gameSessionManager.registerSessionTimeoutListener(
      this.emitSessionTimeout.bind(this)
    );
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

        aiClient?.trackEvent({
          name: 'GameState',
          properties: {
            clientPayload: payload,
            responseState: session.GetState()
          }
        });
      } catch (error: any) {
        this.emitError(socket, error.message);
        console.error('Error handling client action:', error);
      }
    });

    socket.on('disconnect', () => {
      try {
        const session = this.gameEngine.GetSession(socket);
        this.gameEngine.Disconnect(session, socket.id);
        this.emitGameState(session);
        aiClient?.trackEvent({
          name: 'ClientDisconnected',
          properties: {
            sessionId: session.SessionId,
            socketId: socket.id
          }
        });
      } catch (error: any) {
        this.emitError(socket, error.message);
        console.error('Error handling client disconnect:', error);
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

  private emitSessionTimeout(sessionId: string) {
    const session = this._gameSessionManager.getGameSession(sessionId);
    if (session) {
      this._io.to(session.SessionId).emit(SocketEvents.ServerEvent, {
        event: GameEvent.SessionTimeout
      });
    }
  }
}
