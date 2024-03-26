export interface Card {
  suit: string;
  value: string;
}

/**
 * Generates a standard deck of playing cards.
 * Shuffles a deck of cards using the Fisher-Yates algorithm.
 * @returns {Array<{ suit: string, value: string }>} The generated deck of cards.
 */
export function generateDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A'
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  // Shuffle the deck using the Fisher-Yates algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
