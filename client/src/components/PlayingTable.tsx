import React, { CSSProperties, useCallback, useMemo } from 'react';
import './PlayingTable.css';
import { useAtom } from 'jotai';
import {
  currentPlayerAtom,
  gameStateAtom,
  currentTrickPlayedCardsAtom,
  socketAtom
} from '../gameState/gameState';
import { PlayerState } from '../sharedTypes';

const PlayingTable = () => {
  const [gameState] = useAtom(gameStateAtom);
  const [socket] = useAtom(socketAtom);

  const [currentTrickPlayedCards] = useAtom(currentTrickPlayedCardsAtom);
  const [currentPlayer] = useAtom(currentPlayerAtom);

  const myPlayerIndex = useMemo(
    () => gameState?.players.findIndex((player) => player.id === socket?.id),
    [gameState, socket]
  );

  const partnerPlayerIndex = useMemo(
    () => (myPlayerIndex !== undefined ? (myPlayerIndex + 2) % 4 : undefined),
    [myPlayerIndex]
  );

  const previousPlayerIndex = useMemo(
    () => (myPlayerIndex !== undefined ? (myPlayerIndex + 3) % 4 : undefined),
    [myPlayerIndex]
  );

  const nextPlayerIndex = useMemo(
    () => (myPlayerIndex !== undefined ? (myPlayerIndex + 1) % 4 : undefined),
    [myPlayerIndex]
  );

  console.log('myPlayerIndex', myPlayerIndex);
  console.log('partnerPlayerIndex', partnerPlayerIndex);
  console.log('previousPlayerIndex', previousPlayerIndex);
  console.log('nextPlayerIndex', nextPlayerIndex);

  const myPlayer = useMemo(() => {
    if (myPlayerIndex === undefined) return undefined;
    return gameState?.players[myPlayerIndex];
  }, [gameState, myPlayerIndex]);

  const partnerPlayer = useMemo(() => {
    if (partnerPlayerIndex === undefined) return undefined;
    return gameState?.players[partnerPlayerIndex];
  }, [gameState, partnerPlayerIndex]);

  const nextPlayer = useMemo(() => {
    if (nextPlayerIndex === undefined) return undefined;
    return gameState?.players[nextPlayerIndex];
  }, [gameState, nextPlayerIndex]);

  const previousPlayer = useMemo(() => {
    if (previousPlayerIndex === undefined) return undefined;
    return gameState?.players[previousPlayerIndex];
  }, [gameState, previousPlayerIndex]);

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

  const myPlayedCard =
    myPlayerIndex !== undefined ? currentTrickPlayedCards[myPlayerIndex] : null;
  const partnerPlayedCard =
    partnerPlayerIndex !== undefined
      ? currentTrickPlayedCards[partnerPlayerIndex]
      : null;
  const nextPlayerPlayedCard =
    nextPlayerIndex !== undefined
      ? currentTrickPlayedCards[nextPlayerIndex]
      : null;
  const previousPlayerPlayedCard =
    previousPlayerIndex !== undefined
      ? currentTrickPlayedCards[previousPlayerIndex]
      : null;

  const bottomPlayer = (
    <div className="player active-user" style={getStyle(myPlayer)}>
      <div className="username">
        {myPlayer?.name}
        {myPlayedCard && (
          <img
            src={`/images/cards/${myPlayedCard.suit}_${myPlayedCard.value}.svg`}
            alt="active user's card"
          />
        )}
      </div>
    </div>
  );

  const topPlayer = (
    <div className="player partner" style={getStyle(partnerPlayer)}>
      {partnerPlayer?.name}
      {partnerPlayedCard && (
        <img
          src={`/images/cards/${partnerPlayedCard.suit}_${partnerPlayedCard.value}.svg`}
          alt="partner's card"
        />
      )}
    </div>
  );

  const rightPlayerElement = (
    <div className={`player right-player`} style={getStyle(nextPlayer)}>
      {nextPlayer?.name}
      {nextPlayerPlayedCard && (
        <img
          src={`/images/cards/${nextPlayerPlayedCard.suit}_${nextPlayerPlayedCard.value}.svg`}
          alt="opponent1's card"
        />
      )}
    </div>
  );

  const leftPlayerElement = (
    <div className={`player left-player`} style={getStyle(previousPlayer)}>
      {previousPlayer?.name}
      {previousPlayerPlayedCard && (
        <img
          src={`/images/cards/${previousPlayerPlayedCard.suit}_${previousPlayerPlayedCard.value}.svg`}
          alt="opponent2's card"
        />
      )}
    </div>
  );

  return (
    <div className="playing-table">
      {myPlayer && (
        <div>
          {topPlayer}
          {rightPlayerElement}
          {leftPlayerElement}
          {bottomPlayer}
        </div>
      )}
    </div>
  );
};

export default PlayingTable;
