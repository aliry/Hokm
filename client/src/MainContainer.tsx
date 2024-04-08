import React from 'react';
import { useSocket } from './gameState/gameHooks';
import { useAtom } from 'jotai';
import { gameInitStateAtom } from './gameState/gameState';
import { PlayerCardPanel } from './oldComponents/PlayerCardPanel';
import { SaveLoadPanel } from './oldComponents/saveLoadPanel';
import { SidePanel } from './oldComponents/sidePanel';
import { StatePanel } from './oldComponents/statePanel';
import { RightPanel } from './oldComponents/rightPanel';
import PlayingTable from './components/PlayingTable';
import CardHand from './components/CardHand';

export const MainContainer = () => {
  const [gameInitState] = useAtom(gameInitStateAtom);

  useSocket();

  if (!gameInitState.socketId) return <div>Connecting...</div>;

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ border: '1px black solid', flex: 0 }}>
        <SidePanel />
        <PlayerCardPanel />
        <SaveLoadPanel />
      </div>
      {/* <StatePanel /> */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <PlayingTable />
        <CardHand />
      </div>
      <RightPanel />
    </div>
  );
};
