import { useAtom } from "jotai";
import { Card } from "../sharedTypes";
import { appStateAtom } from "../gameState/gameState";

const CardsFolderPrefix = '/images/decks/';

export const useCardImage = () => {
  const [appState] = useAtom(appStateAtom);
  const { cardThemeName } = appState;

  return (card: Card, themeName?: string) => {
    let suit = card.suit[0].toUpperCase();
    let value = card.value as string;

    if (value === '10') {
      value = 'T';
    }

    return `${CardsFolderPrefix}${themeName ?? cardThemeName}/${value}${suit}.svg`;
  }

}