import React from 'react';
import './PlayingTable.css';
import { useAtom } from 'jotai';
import {
  myTeamPlayersAtom,
  opponentTeamPlayersAtom,
  playerPlayedCardAtom
} from '../gameState/gameState';

const PlayingTable = () => {
  const [myTeamPlayers] = useAtom(myTeamPlayersAtom);
  const [opponentTeamPlayers] = useAtom(opponentTeamPlayersAtom);
  const [playerPlayedCard] = useAtom(playerPlayedCardAtom);

  return (
    <div className="playing-table">
      <div className="player partner">
        {myTeamPlayers?.partner.name}
        {playerPlayedCard?.partnerCard && (
          <img
            src={`/images/cards/${playerPlayedCard.partnerCard.suit}_${playerPlayedCard.partnerCard.value}.svg`}
            alt="partner's card"
          />
        )}
      </div>
      <div className="player opponent opponent1">
        {opponentTeamPlayers?.player1.name}
        {playerPlayedCard?.opponent1Card && (
          <img
            src={`/images/cards/${playerPlayedCard.opponent1Card.suit}_${playerPlayedCard.opponent1Card.value}.svg`}
            alt="opponent1's card"
          />
        )}
      </div>
      <div className="player opponent opponent2">
        {opponentTeamPlayers?.player2.name}
        {playerPlayedCard?.opponent2Card && (
          <img
            src={`/images/cards/${playerPlayedCard.opponent2Card.suit}_${playerPlayedCard.opponent2Card.value}.svg`}
            alt="opponent2's card"
          />
        )}
      </div>
      <div className="player active-user">
        <div className="username">
          {myTeamPlayers?.me.name}
          {playerPlayedCard?.myCard && (
            <img
              src={`/images/cards/${playerPlayedCard.myCard.suit}_${playerPlayedCard.myCard.value}.svg`}
              alt="active user's card"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayingTable;
