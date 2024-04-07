import React, { CSSProperties } from 'react';
import { Card } from '../sharedTypes';
interface CardProps {
  card: Card;
  style: CSSProperties;
}

export const PlayingCard: React.FC<CardProps> = ({ card, style }) => {
  const cardName = `${card.suit}_${card.value}`;

  return (
    <img
      src={`/images/cards/${cardName}.svg`}
      alt={cardName}
      className="card"
      style={style}
    />
  );
};
