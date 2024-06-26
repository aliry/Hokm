import AppBar from '@mui/material/AppBar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import { useLoadGame, useSaveGame } from '../gameState/gameHooks';
import { appStateAtom } from '../gameState/gameState';
import { useAtom } from 'jotai';

const drawerWidth = 240;
const appName = 'HOKM';

export const GameAppBar = () => {
  const [, setAppState] = useAtom(appStateAtom);
  const [mobileOpen, setMobileOpen] = useState(false);
  const saveGame = useSaveGame();
  const loadGame = useLoadGame();

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const appLogo = useMemo(
    () => <img style={{ width: 64 }} src="logo192.png" alt="App Logo" />,
    []
  );

  const navItems = [
    {
      text: 'Save game',
      onClick: saveGame
    },
    {
      text: 'Load game',
      onClick: () => loadGame()
    },
    {
      text: 'Team Codes',
      onClick: () => {
        setAppState((prev) => ({ ...prev, showTeamCodeDialog: true }));
      }
    },
    {
      text: 'Cards Theme',
      onClick: () => {
        setAppState((prev) => ({ ...prev, showCardThemeDialog: true }));
      }
    }
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      {appLogo}
      <Typography variant="h6" sx={{ my: 2 }}>
        {appName}
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton sx={{ textAlign: 'center' }}>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar component="nav">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{appLogo}</Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            {appName}
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map((item) => (
              <Button
                key={item.text}
                sx={{ color: '#fff' }}
                onClick={item.onClick}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth
            }
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </>
  );
};
