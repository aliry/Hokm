import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Team1Color, Team2Color } from '../gameConfigs';
import './GameStateBoard.css';
import { useAtom } from 'jotai';
import { appStateAtom, gameStateAtom } from '../gameState/gameState';
import { FC } from 'react';
import Chip from '@mui/material/Chip';

interface TrickChipProps {
  index: number;
  onclick: () => void;
}
interface ScoreContainerProps {
  teamName: string;
  bgColor: string;
  gameScore?: number;
  roundScore?: number;
}

const TrickChip: FC<TrickChipProps> = ({ index, onclick }) => {
  return <Chip sx={{ m: 0.1 }} label={`${index + 1}`} onClick={onclick} />;
}

const ScoreContainer: FC<ScoreContainerProps> = ({
  teamName,
  bgColor,
  gameScore,
  roundScore,
}) => {
  const previousTricks = [];
  if (roundScore && roundScore > 0) {
    for (let i = 0; i < roundScore; i++) {
      const onclick = () => {
        // TODO: Implement trick click to show cards played by each player in the trick
        console.log(`Trick ${i + 1} clicked`);
      }
      previousTricks.push(<TrickChip key={i} index={i} onclick={onclick} />);
    }
  }

  return (
    <Paper
      className="team-score-container"
      sx={{
        backgroundColor: bgColor
      }}
    >
      <Chip sx={{ mt: 1, ml: 1 }} label={teamName} />
      <Box sx={{ m: 1 }}>Game score: {gameScore}</Box>
      <Box sx={{ m: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
        <Box>This round tricks:</Box>
        {previousTricks}
      </Box>
    </Paper>
  )
};

export const GameStateBoard = () => {
  const [gameState] = useAtom(gameStateAtom);
  const [appState] = useAtom(appStateAtom);

  const team1code = appState.teamCodes[0];
  const team2code = appState.teamCodes[1];
  return (
    <Box className="state-board-container">
      <ScoreContainer
        teamName='Team 1'
        bgColor={Team1Color}
        gameScore={gameState?.scores[team1code]}
        roundScore={gameState?.currentRound?.score[team1code]}
      />
      <ScoreContainer
        teamName='Team 2'
        bgColor={Team2Color}
        gameScore={gameState?.scores[team2code]}
        roundScore={gameState?.currentRound?.score[team2code]}
      />
    </Box>
  );
};
