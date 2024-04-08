import React, { useEffect, useState } from 'react';
import './CardHand.css';
import { PlayingCard } from './PlayingCard';
import { useAtom } from 'jotai';
import { cardsAtom, isCurrentPlayerTurnAtom } from '../gameState/gameState';
import { Card } from '../sharedTypes';
import { usePlayCard } from '../gameState/gameHooks';

const CardHand = () => {
  const playCard = usePlayCard();
  const [myCards] = useAtom(cardsAtom);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCurrentPlayerTurn] = useAtom(isCurrentPlayerTurnAtom);

  const totalCards = myCards.length;

  useEffect(() => {
    setSelectedCard(null);
  }, [myCards]);

  // Adjust these values as needed
  const maxArc = 30; // maximum arc degree when many cards
  const minDistance = 5; // minimum distance in degrees between cards

  // Calculate the distance between cards based on total number of cards
  const distanceBetweenCards =
    totalCards > 1 ? Math.min(maxArc / (totalCards - 1), minDistance) : 0;

  // Adjust the arc based on distance between cards and total number of cards
  const arc = distanceBetweenCards * (totalCards - 1);
  const arcStart = (180 - arc) / 2; // rotation offset
  const radius = 800; // change this to increase or decrease the spread

  const handleCardSelect = (card: Card) => {
    if (!isCurrentPlayerTurn) return;
    setSelectedCard(card);
    playCard(card);
  };

  return (
    <div className="card-hand" style={{ top: (radius - 20) * -1 }}>
      {myCards.map((card, i) => {
        const rotation = 180 - (arcStart + i * distanceBetweenCards);
        const isSelected = selectedCard === card;
        const transform = `rotate(${rotation}deg) translateX(${
          radius + (isSelected ? -200 : 0)
        }px) rotate(-${rotation}deg)`;
        return (
          <PlayingCard
            card={card}
            key={i}
            style={{
              transform,
              position: 'absolute',
              transition: isSelected ? 'transform 2s, opacity 2s' : undefined,
              opacity: isSelected ? 0 : 1,
              zIndex: isSelected ? 100 : 1
            }}
            onClick={() => handleCardSelect(card)}
          />
        );
      })}
    </div>
  );
};

export default CardHand;
