import PlayingTable from '../components/PlayingTable';
import CardHand from '../components/CardHand';
import { useAtom } from 'jotai';
import { useSocket } from '../gameState/gameHooks';
import { appStateAtom } from '../gameState/gameState';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { GameAppBar } from '../components/gameAppBar';
import { PlayerNameDialog } from '../components/playerNameDialog';
import { StarterDialog } from '../components/StarterDialog';
import { useQueryParams } from '../hooks/useQueryParams';

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
      <PlayerNameDialog />
      <StarterDialog />
      <Container sx={{ my: 10 }}>
        <Paper sx={{ minHeight: 100, marginBottom: 3 }}></Paper>
        <PlayingTable />
        <CardHand />
      </Container>
    </Box>
  );
}
