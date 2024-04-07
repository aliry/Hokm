import React from 'react';
import { useSocket } from './gameState/gameHooks';
import { useAtom } from 'jotai';
import { gameInitStateAtom } from './gameState/gameState';
import { PlayerCardPanel } from './components/PlayerCardPanel';
import { SaveLoadPanel } from './saveLoadPanel';
import { SidePanel } from './sidePanel';
import { StatePanel } from './statePanel';
import { RightPanel } from './rightPanel';
import PlayingTable from './components/PlayingTable';

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
      <StatePanel />
      {/* <PlayingTable /> */}
      <RightPanel />
    </div>
  );
};
