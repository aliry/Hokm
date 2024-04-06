import { useAtom } from 'jotai';
import { usePlayCard } from '../gameState/gameHooks';
import { cardsAtom } from '../gameState/gameState';

export const PlayerCardPanel = () => {
  const [cards] = useAtom(cardsAtom);
  const playCard = usePlayCard();
  return (
    <div>
      {cards.map((card, index) => (
        <div key={index}>
          <button onClick={() => playCard(card)}>
            {card.value} of {card.suit}
          </button>
        </div>
      ))}
    </div>
  );
};
