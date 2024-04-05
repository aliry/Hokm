import { FC } from 'react';
import { GameAction } from '../constants';
import { Card } from '../sharedTypes';

export interface PlayerCardProps {
  emitAction: (action: GameAction, data: any) => void;
  cards: Card[];
}

export const PlayerCardPanel: FC<PlayerCardProps> = ({ cards, emitAction }) => {
  return (
    <div>
      {cards.map((card, index) => (
        <div key={index}>
          <button onClick={() => emitAction(GameAction.PlayCard, { card })}>
            {card.value} of {card.suit}
          </button>
        </div>
      ))}
    </div>
  );
};
