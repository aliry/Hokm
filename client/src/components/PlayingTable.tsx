import { CSSProperties, useCallback, useMemo } from 'react';
import './PlayingTable.css';
import { useAtom } from 'jotai';
import {
  currentPlayerAtom,
  currentTrickPlayedCardsAtom,
  trumpSuitAtom,
  myPlayerAtom,
  playersAtom,
  hakemPlayerAtom
} from '../gameState/gameState';
import { PlayerState } from '../sharedTypes';
import { DisabledPlayerColor, Team1Color, Team2Color } from '../gameConfigs';

const PlayingTable = () => {
  const [myPlayer] = useAtom(myPlayerAtom);
  const [players] = useAtom(playersAtom);
  const [trumpSuit] = useAtom(trumpSuitAtom);
  const [hakemPlayer] = useAtom(hakemPlayerAtom);

  const [currentTrickPlayedCards] = useAtom(currentTrickPlayedCardsAtom);
  const [currentPlayer] = useAtom(currentPlayerAtom);

  const myPlayerIndex = useMemo(
    () => players?.findIndex((player) => player.id === myPlayer?.id),
    [players, myPlayer]
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

  const partnerPlayer = useMemo(() => {
    if (partnerPlayerIndex === undefined) return undefined;
    return players?.[partnerPlayerIndex];
  }, [players, partnerPlayerIndex]);

  const nextPlayer = useMemo(() => {
    if (nextPlayerIndex === undefined) return undefined;
    return players?.[nextPlayerIndex];
  }, [players, nextPlayerIndex]);

  const previousPlayer = useMemo(() => {
    if (previousPlayerIndex === undefined) return undefined;
    return players?.[previousPlayerIndex];
  }, [players, previousPlayerIndex]);

  const getStyle = useCallback(
    (player?: PlayerState | null) => {
      const style: CSSProperties = {};

      // highlight the current player
      if (player?.id && currentPlayer?.id && currentPlayer.id === player.id) {
        style.border = '3px solid orangeRed';
      }
      // gray out background color when any player is not connected
      if (player?.connected) {
        const team1Code = players?.[0].teamCode;
        if (player.teamCode === team1Code) {
          style.backgroundColor = Team1Color;
        } else {
          style.backgroundColor = Team2Color;
        }
      } else {
        style.backgroundColor = DisabledPlayerColor;
      }
      return style;
    },
    [currentPlayer, players]
  );

  const trumpSuitIcon = useMemo(() => {
    if (!trumpSuit) return null;
    return (
      <img
        className="trump-suit-icon"
        src={`/images/icons/${trumpSuit}.svg`}
        alt="trump suit"
      />
    );
  }, [trumpSuit]);

  const getPlayerNameElement = useCallback(
    (player?: PlayerState | null) => {
      if (!player) return null;
      return (
        <div className="player-name-container">
          <div className="player-name">{player.name}</div>
          {hakemPlayer?.id === player.id ? trumpSuitIcon : null}
        </div>
      );
    },
    [hakemPlayer, trumpSuitIcon]
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
        {getPlayerNameElement(myPlayer)}
        {myPlayedCard && (
          <img
            className="player-card active-user-card"
            src={`/images/cards/${myPlayedCard.suit}_${myPlayedCard.value}.svg`}
            alt="active user's card"
          />
        )}
      </div>
    </div>
  );

  const topPlayer = (
    <div className="player partner" style={getStyle(partnerPlayer)}>
      {getPlayerNameElement(partnerPlayer)}
      {partnerPlayedCard && (
        <img
          className="player-card partner-card"
          src={`/images/cards/${partnerPlayedCard.suit}_${partnerPlayedCard.value}.svg`}
          alt="partner's card"
        />
      )}
    </div>
  );

  const rightPlayerElement = (
    <div className={`player right-player`} style={getStyle(nextPlayer)}>
      {getPlayerNameElement(nextPlayer)}
      {nextPlayerPlayedCard && (
        <img
          className="player-card right-player-card"
          src={`/images/cards/${nextPlayerPlayedCard.suit}_${nextPlayerPlayedCard.value}.svg`}
          alt="opponent1's card"
        />
      )}
    </div>
  );

  const leftPlayerElement = (
    <div className={`player left-player`} style={getStyle(previousPlayer)}>
      {getPlayerNameElement(previousPlayer)}
      {previousPlayerPlayedCard && (
        <img
          className="player-card left-player-card"
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
