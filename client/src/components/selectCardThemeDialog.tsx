import { useAtom } from "jotai"
import { appStateAtom } from "../gameState/gameState";
import { useCardImage } from "../hooks/useCardImage";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import DialogContent from "@mui/material/DialogContent";
import { useEffect, useState } from "react";
import { CardThemeNames } from "../gameConfigs";
import IconButton from "@mui/material/IconButton";
import CloseIcon from '@mui/icons-material/Close';

export const SelectCardThemeDialog: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [appState, setAppState] = useAtom(appStateAtom);
  const getCardImage = useCardImage();

  useEffect(() => {
    setOpen(appState.showCardThemeDialog);
  }, [appState.showCardThemeDialog]);

  const handleClose = () => {
    setAppState((prev) => ({ ...prev, showCardThemeDialog: false }));
  }

  return (
    <Dialog open={open}>
      <DialogTitle>Choose Card Theme</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500]
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent>
        <Grid container spacing={2}>
          {CardThemeNames.map((themeName) => (
            <Grid item key={themeName}>
              <img
                src={getCardImage({ value: 'K', suit: 'spades' }, themeName)}
                alt={themeName}
                onClick={() => {
                  setAppState((prev) => ({ ...prev, cardThemeName: themeName, showCardThemeDialog: false }));
                }}
                style={{ cursor: 'pointer', width: 100 }}
              />
            </Grid>
          )
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}