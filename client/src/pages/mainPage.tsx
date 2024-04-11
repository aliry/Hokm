import PlayingTable from '../components/PlayingTable';
import CardHand from '../components/CardHand';
import { useAtom } from 'jotai';
import { useSocket } from '../gameState/gameHooks';
import { appStateAtom } from '../gameState/gameState';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { GameAppBar } from '../components/gameAppBar';
import { PlayerNameDialog } from '../components/playerNameDialog';
import { useQueryParams } from '../hooks/useQueryParams';
import { GameStateBoard } from '../components/GameStateBoard';
import { ShareTeamCodesDialog } from '../components/ShareTeamCodesDialog';

export function MainPage() {
  const [appState, setAppState] = useAtom(appStateAtom);

  // Check if there is a team code in the query parameters
  const teamCode = useQueryParams().get('teamCode');
  if (teamCode && teamCode.length > 0) {
    setAppState((prev) => ({ ...prev, teamCode }));
  }

  useSocket();

  if (!appState.socketId) return <div>Connecting...</div>;

  return (
    <Box sx={{ display: 'flex' }}>
      <GameAppBar />
      {!appState.gameStarted && (
        <>
          <PlayerNameDialog />
          <ShareTeamCodesDialog />
        </>
      )}
      <Container sx={{ my: 10 }}>
        <GameStateBoard />
        <PlayingTable />
        <CardHand />
      </Container>
    </Box>
  );
}
