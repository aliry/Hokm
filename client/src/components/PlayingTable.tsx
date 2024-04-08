import React, { CSSProperties, useCallback, useMemo } from 'react';
import './PlayingTable.css';
import { useAtom } from 'jotai';
import {
  currentPlayerAtom,
  myTeamPlayersAtom,
  opponentTeamPlayersAtom,
  playerPlayedCardAtom
} from '../gameState/gameState';
import { PlayerState } from '../sharedTypes';

const PlayingTable = () => {
  const [myTeamPlayers] = useAtom(myTeamPlayersAtom);
  const [opponentTeamPlayers] = useAtom(opponentTeamPlayersAtom);
  const [playerPlayedCard] = useAtom(playerPlayedCardAtom);
  const [currentPlayer] = useAtom(currentPlayerAtom);

  const getStyle = useCallback(
    (player?: PlayerState) => {
      const style: CSSProperties = {};

      // highlight the current player
      if (player?.id && currentPlayer?.id && currentPlayer.id === player.id) {
        style.border = '2px solid red';
      }
      // gray out background color when any player is not connected
      if (player?.connected) {
        style.backgroundColor = 'rgb(176, 235, 28)';
      } else {
        style.backgroundColor = 'rgb(200, 200, 200)';
      }
      return style;
    },
    [currentPlayer]
  );
  return (
    <div className="playing-table">
      <div className="player partner" style={getStyle(myTeamPlayers?.partner)}>
        {myTeamPlayers?.partner.name}
        {playerPlayedCard?.partnerCard && (
          <img
            src={`/images/cards/${playerPlayedCard.partnerCard.suit}_${playerPlayedCard.partnerCard.value}.svg`}
            alt="partner's card"
          />
        )}
      </div>
      <div
        className="player opponent opponent1"
        style={getStyle(opponentTeamPlayers?.player1)}
      >
        {opponentTeamPlayers?.player1.name}
        {playerPlayedCard?.opponent1Card && (
          <img
            src={`/images/cards/${playerPlayedCard.opponent1Card.suit}_${playerPlayedCard.opponent1Card.value}.svg`}
            alt="opponent1's card"
          />
        )}
      </div>
      <div
        className="player opponent opponent2"
        style={getStyle(opponentTeamPlayers?.player2)}
      >
        {opponentTeamPlayers?.player2.name}
        {playerPlayedCard?.opponent2Card && (
          <img
            src={`/images/cards/${playerPlayedCard.opponent2Card.suit}_${playerPlayedCard.opponent2Card.value}.svg`}
            alt="opponent2's card"
          />
        )}
      </div>
      <div className="player active-user" style={getStyle(myTeamPlayers?.me)}>
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
