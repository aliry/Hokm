import { GameAction } from "./constants";
import { GameSessionState } from "./sharedTypes";

export interface PlayerCardProps {
  emitAction: (action: GameAction, data: any) => void;
  gameStates?: GameSessionState;
}

export const PlayerCardPanel = (props: PlayerCardProps) => {
  return (
    <div>
      {/* <PlayerCard /> */}
    </div>
  );
};