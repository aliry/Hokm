import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Team1Color, Team2Color } from '../gameConfigs';
import './GameStateBoard.css';
import { useAtom } from 'jotai';
import { appStateAtom, gameStateAtom } from '../gameState/gameState';
import { FC } from 'react';

interface ScoreContainerProps {
  bgColor: string;
  gameScore?: number;
  roundScore?: number;
}

const ScoreContainer: FC<ScoreContainerProps> = ({
  bgColor,
  gameScore,
  roundScore
}) => (
  <Paper
    className="team-score-container"
    sx={{
      backgroundColor: bgColor
    }}
  >
    <Box sx={{ m: 1 }}>Game score: {gameScore}</Box>
    <Box sx={{ m: 1 }}>Round score: {roundScore}</Box>
  </Paper>
);

export const GameStateBoard = () => {
  const [gameState] = useAtom(gameStateAtom);
  const [appState] = useAtom(appStateAtom);

  const team1code = appState.teamCodes[0];
  const team2code = appState.teamCodes[1];
  return (
    <Box className="state-board-container">
      <ScoreContainer
        bgColor={Team1Color}
        gameScore={gameState?.scores[team1code]}
        roundScore={gameState?.currentRound?.score[team1code]}
      />
      <ScoreContainer
        bgColor={Team2Color}
        gameScore={gameState?.scores[team2code]}
        roundScore={gameState?.currentRound?.score[team2code]}
      />
    </Box>
  );
};
