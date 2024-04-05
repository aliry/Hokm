import React from 'react';
import './CardHand.css';
import { Card } from './Card';

interface CardHandProps {
  cards: string[];
}

const CardHand: React.FC<CardHandProps> = ({ cards }) => {
  const totalCards = cards.length;
  const arc = 30; // degree of arc    
  const arcStart = (180 - arc) / 2; // rotation offset    
  const radius = 800; // change this to increase or decrease the spread    

  return (
    <div className="card-hand" style={{ top: (radius - 20) * -1 }}>
      {cards.map((card, i) => {
        const rotation = 180 - (arcStart + (i * (arc / (totalCards - 1))));
        const transform = `rotate(${rotation}deg) translate(${radius}px)  rotate(-${rotation}deg)`;
        return <Card card={card} key={card} style={{ transform, position: 'absolute' }} />;
      })}
    </div>
  );
};

export default CardHand;  
