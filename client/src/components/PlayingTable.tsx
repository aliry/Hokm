import React from 'react';
import './PlayingTable.css';
import CardHand from './CardHand';

interface PlayingTableProps {
  activeUser: string;
  partner: string;
  opponent1: string;
  opponent2: string;
  activeUserCard?: string;
  partnerCard?: string;
  opponent1Card?: string;
  opponent2Card?: string;
}

const PlayingTable: React.FC<PlayingTableProps> = ({ activeUser, partner, opponent1, opponent2, activeUserCard, partnerCard, opponent1Card, opponent2Card }) => {
  return (
    <div className="playing-table">
      <div className="player partner">
        {partner}
        {partnerCard && <img src={`/images/cards/${partnerCard}.svg`} alt="partner's card" />}
      </div>
      <div className="player opponent opponent1">
        {opponent1}
        {opponent1Card && <img src={`/images/cards/${opponent1Card}.svg`} alt="opponent1's card" />}
      </div>
      <div className="player opponent opponent2">
        {opponent2}
        {opponent2Card && <img src={`/images/cards/${opponent2Card}.svg`} alt="opponent2's card" />}
      </div>
      <div className="player active-user">
        <div className="username">
          {activeUser}
          {activeUserCard && <img src={`/images/cards/${activeUserCard}.svg`} alt="active user's card" />}
        </div>
      </div>
    </div>
  );
};


export default PlayingTable;  
