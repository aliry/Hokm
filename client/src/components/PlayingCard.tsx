import React, { CSSProperties } from 'react';
import { Card } from '../sharedTypes';
interface CardProps {
  card: Card;
  style: CSSProperties;
  onClick?: () => void;
}

export const PlayingCard: React.FC<CardProps> = ({ card, style, onClick }) => {
  const cardName = `${card.suit}_${card.value}`;

  return (
    <img
      src={`/images/cards/${cardName}.svg`}
      alt={cardName}
      className="card"
      style={style}
      onClick={() => onClick && onClick()}
    />
  );
};
