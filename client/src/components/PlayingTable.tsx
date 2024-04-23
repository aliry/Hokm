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
import { useIsMobile } from '../hooks/useWindowSize';
import { useCardImage } from '../hooks/useCardImage';

const PlayingTable = () => {
  const [myPlayer] = useAtom(myPlayerAtom);
  const [players] = useAtom(playersAtom);
  const [trumpSuit] = useAtom(trumpSuitAtom);
  const [hakemPlayer] = useAtom(hakemPlayerAtom);
  const isMobile = useIsMobile();
  const getCardImage = useCardImage();


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

  const getPlayerNameFontSize = useMemo(() => (name: string) => {
    const nameLen = name.length;
    if (nameLen < 7) {
      return isMobile ? 14 : 18;
    } else if (nameLen < 9) {
      return isMobile ? 12 : 14;
    } else {
      return isMobile ? 10 : 12;
    }
  }, [isMobile]);

  const getPlayerNameElement = useCallback(
    (player?: PlayerState | null) => {
      if (!player) return null;
      return (
        <div
          className="player-name-container"
          style={{ fontSize: getPlayerNameFontSize(player.name) }}
        >
          <div className="player-name">{player.name}</div>
          {hakemPlayer?.id === player.id ? trumpSuitIcon : null}
        </div>
      );
    },
    [getPlayerNameFontSize, hakemPlayer?.id, trumpSuitIcon]
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
            src={getCardImage(myPlayedCard)}
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
          src={getCardImage(partnerPlayedCard)}
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
          src={getCardImage(nextPlayerPlayedCard)}
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
          src={getCardImage(previousPlayerPlayedCard)}
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
