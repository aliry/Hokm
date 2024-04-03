import React, { CSSProperties } from 'react';
interface CardProps {
  card: string;
  style: CSSProperties;
}

export const Card: React.FC<CardProps> = ({ card, style }) => (
  <img src={`/images/cards/${card}.svg`} alt={card} className="card" style={style} />
);
