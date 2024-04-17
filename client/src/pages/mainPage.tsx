import PlayingTable from '../components/PlayingTable';
import CardHand from '../components/CardHand';
import { useAtom } from 'jotai';
import { useSocket } from '../gameState/gameHooks';
import { appStateAtom } from '../gameState/gameState';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { GameAppBar } from '../components/gameAppBar';
import { StarterDialog } from '../components/starterDialog';
import { GameStateBoard } from '../components/GameStateBoard';
import { ShareTeamCodesDialog } from '../components/ShareTeamCodesDialog';
import { RoundEndDialog } from '../components/roundEndDialog';
import { GameAlert } from '../components/gameAlert';

export function MainPage() {
  const [appState, setAppState] = useAtom(appStateAtom);
  const { teamCode } = appState;

  // Check if there is a team code in the query parameters
  if (!teamCode) {
    const newTeamCode = new URLSearchParams(window.location.search).get(
      'teamCode'
    );
    if (newTeamCode && newTeamCode.length > 0) {
      setAppState((prev) => ({ ...prev, teamCode: newTeamCode }));
    }
  }

  useSocket();

  if (!appState.socketId) return <div>Connecting...</div>;

  return (
    <Box sx={{ display: 'flex' }}>
      <GameAlert />
      <GameAppBar />
      <StarterDialog />
      <ShareTeamCodesDialog />
      <RoundEndDialog />
      <Container sx={{ my: 10 }}>
        <GameStateBoard />
        <PlayingTable />
        <CardHand />
      </Container>
    </Box>
  );
}
