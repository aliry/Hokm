import { Copyright } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { GameAppBar } from '../components/gameAppBar';

export function MainPage() {
  return (
    <>
      <GameAppBar />
      <Box sx={{ display: 'flex' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Material UI Create React App example in TypeScript
        </Typography>
        <Copyright />
      </Box>
    </>
  );
}
