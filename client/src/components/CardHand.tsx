import React from 'react';
import './CardHand.css';
import { PlayingCard } from './PlayingCard';
import { useAtom } from 'jotai';
import { cardsAtom } from '../gameState/gameState';

const CardHand = () => {
  const [myCards] = useAtom(cardsAtom);
  const totalCards = myCards.length;
  const arc = 30; // degree of arc
  const arcStart = (180 - arc) / 2; // rotation offset
  const radius = 800; // change this to increase or decrease the spread

  return (
    <div className="card-hand" style={{ top: (radius - 20) * -1 }}>
      {myCards.map((card, i) => {
        const rotation = 180 - (arcStart + i * (arc / (totalCards - 1)));
        const transform = `rotate(${rotation}deg) translate(${radius}px)  rotate(-${rotation}deg)`;
        return (
          <PlayingCard
            card={card}
            key={i}
            style={{ transform, position: 'absolute' }}
          />
        );
      })}
    </div>
  );
};

export default CardHand;
