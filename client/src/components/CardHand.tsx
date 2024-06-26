import React, { useEffect, useMemo, useState } from 'react';
import './CardHand.css';
import { PlayingCard } from './PlayingCard';
import { useAtom } from 'jotai';
import {
  cardsAtom,
  isCurrentPlayerTurnAtom,
  trumpSuitAtom
} from '../gameState/gameState';
import { Card } from '../sharedTypes';
import { usePlayCard, useSetTrumpSuit } from '../gameState/gameHooks';
import Box from '@mui/material/Box';
import { useIsMobile } from '../hooks/useWindowSize';

const CardHand = () => {
  const playCard = usePlayCard();
  const [myCards] = useAtom(cardsAtom);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCurrentPlayerTurn] = useAtom(isCurrentPlayerTurnAtom);
  const [trumpSuit] = useAtom(trumpSuitAtom);
  const selectTrumpSuit = useSetTrumpSuit();
  const isMobile = useIsMobile();

  const totalCards = myCards.length;
  const isTrumpSuitSelectionMode = useMemo(
    () => myCards.length === 5 && !trumpSuit,
    [myCards, trumpSuit]
  );

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
  const radius = isMobile ? 500 : 800; // change this to increase or decrease the spread

  const handleCardSelect = (card: Card) => {
    if (!isCurrentPlayerTurn) return;
    setSelectedCard(card);

    if (isTrumpSuitSelectionMode) {
      selectTrumpSuit(card.suit);
    } else {
      setTimeout(() => {
        playCard(card);
      }, 500);
    }
  };

  return (
    <Box className="cards-hand-container">
      <div className="card-hand" style={{ top: (radius - 20) * -1 }}>
        {myCards.map((card, i) => {
          const rotation = 180 - (arcStart + i * distanceBetweenCards);
          const isSelected = selectedCard === card;
          const transform = `rotate(${rotation}deg) translateX(${radius}px) rotate(-${rotation}deg)`;
          return (
            <PlayingCard
              card={card}
              key={i}
              style={{
                transform,
                position: 'absolute',
                transition: isSelected ? 'transform 1s, opacity 1s' : undefined,
                opacity: isSelected ? 0 : 1,
                zIndex: isSelected ? 100 : 1
              }}
              onClick={() => handleCardSelect(card)}
            />
          );
        })}
      </div>
      <Box sx={{ textAlign: 'center', color: 'red' }}>
        {isTrumpSuitSelectionMode ? 'Select Trump Suit' : ''}
      </Box>
    </Box>
  );
};

export default CardHand;
