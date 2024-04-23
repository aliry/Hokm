import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Team1Color, Team2Color } from '../gameConfigs';
import './GameStateBoard.css';
import { useAtom } from 'jotai';
import {
  appStateAtom,
  gameStateAtom,
  playersAtom
} from '../gameState/gameState';
import { FC, useState } from 'react';
import Chip from '@mui/material/Chip';
import { Trick } from '../sharedTypes';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { useCardImage } from '../hooks/useCardImage';

interface TrickChipProps {
  index: number;
  trick: Trick;
}
interface ScoreContainerProps {
  teamName: string;
  bgColor: string;
  gameScore?: number;
  tricks?: Trick[];
}

const TrickChip: FC<TrickChipProps> = ({ index, trick }) => {
  const [players] = useAtom(playersAtom);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const getCardImage = useCardImage();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <>
      <Chip
        aria-describedby={id}
        sx={{ m: 0.1 }}
        label={`${index + 1}`}
        onClick={handleClick}
      />
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        {players &&
          trick.items.map((item, index) => {
            const player = players[item.playerIndex];
            return (
              <Box
                key={index}
                sx={{
                  m: 2,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography variant="h6">{player?.name}</Typography>
                <img
                  src={getCardImage(item.card)}
                  alt={`${item.card.suit}${item.card.value}`}
                  style={{ width: 50, height: 70 }}
                />
              </Box>
            );
          })}
      </Popover>
    </>
  );
};

const ScoreContainer: FC<ScoreContainerProps> = ({
  teamName,
  bgColor,
  gameScore,
  tricks
}) => {
  const previousTricks = [];
  if (tricks && tricks.length > 0) {
    for (let i = 0; i < tricks.length; i++) {
      previousTricks.push(<TrickChip key={i} index={i} trick={tricks[i]} />);
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
      <Box className="this-trick-container">
        <Box>Round Tricks:</Box>
        <Box>{previousTricks}</Box>
      </Box>
    </Paper>
  );
};

export const GameStateBoard = () => {
  const [gameState] = useAtom(gameStateAtom);
  const [appState] = useAtom(appStateAtom);

  const team1code = appState.teamCodes[0];
  const team2code = appState.teamCodes[1];

  const team1Tricks = gameState?.currentRound?.tricks.filter(
    (trick) => trick.winnerIndex === 0 || trick.winnerIndex === 2
  );
  const team2Tricks = gameState?.currentRound?.tricks.filter(
    (trick) => trick.winnerIndex === 1 || trick.winnerIndex === 3
  );

  return (
    <Box className="state-board-container">
      <ScoreContainer
        teamName="Team 1"
        bgColor={Team1Color}
        gameScore={gameState?.scores[team1code]}
        tricks={team1Tricks}
      />
      <ScoreContainer
        teamName="Team 2"
        bgColor={Team2Color}
        gameScore={gameState?.scores[team2code]}
        tricks={team2Tricks}
      />
    </Box>
  );
};
