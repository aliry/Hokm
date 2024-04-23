import React, { CSSProperties } from 'react';
import { Card } from '../sharedTypes';
import { useCardImage } from '../hooks/useCardImage';
interface CardProps {
  card: Card;
  style: CSSProperties;
  onClick?: () => void;
}

export const PlayingCard: React.FC<CardProps> = ({ card, style, onClick }) => {
  const getCardImage = useCardImage();

  return (
    <img
      src={getCardImage(card)}
      alt={`${card.suit}${card.value}`}
      className="card"
      style={style}
      onClick={() => onClick && onClick()}
    />
  );
};
