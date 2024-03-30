import { FC, useRef, useState } from "react";
import { GameAction } from "./constants";
import { Card, GameSessionState } from "./sharedTypes";

export interface PlayerCardProps {
  emitAction: (action: GameAction, data: any) => void;
  playerId?: string;
  gameState?: GameSessionState;
}

export const PlayerCardPanel: FC<PlayerCardProps> = ({ gameState, playerId, emitAction }) => {
  const cardsRef = useRef<Card[]>([]);
  if (gameState && playerId) {
    let playerState = gameState.players.find(player => player.id === playerId);
    if (playerState?.cards) {
      cardsRef.current = playerState.cards;
    }
  }
  return (
    <div>
      {cardsRef.current.map((card, index) => (
        <div key={index}>
          <button onClick={() => emitAction(GameAction.PlayCard, { card })}>{card.value} of {card.suit}</button>
        </div>
      ))}
    </div>
  );
};