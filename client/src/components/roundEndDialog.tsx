import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Container } from "@mui/material";
import { useAtom } from "jotai";
import { useState, useEffect, useCallback, useMemo } from "react";
import { appStateAtom, gameStateAtom } from "../gameState/gameState";
import { Team1Color, Team2Color } from "../gameConfigs";
import { useStartNewRound } from "../gameState/gameHooks";

export const RoundEndDialog = () => {
  const [gameState] = useAtom(gameStateAtom);
  const [appState] = useAtom(appStateAtom);
  const [open, setOpen] = useState<boolean>(false);
  const handleStartNewRound = useStartNewRound();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    setOpen(!!gameState?.currentRound?.winnerTeam);
  }, [gameState]);

  const winnerTeamNumber = useMemo(() => appState.teamCodes.indexOf(gameState?.currentRound?.winnerTeam || '') + 1, [appState, gameState]);
  const winnerTeamColor = useMemo(() => winnerTeamNumber === 1 ? Team1Color : Team2Color, [winnerTeamNumber]);

  return (
    <Dialog fullWidth open={open} onClose={handleClose}>
      <DialogTitle>Round Ended</DialogTitle>
      <Container>
        <DialogContent sx={{ backgroundColor: winnerTeamColor }}>
          <DialogContentText sx={{ textAlign: "center" }}>Winner</DialogContentText>
          <DialogContentText sx={{ fontWeight: "bold", textAlign: "center", fontSize: "2em" }}> Team {winnerTeamNumber}</DialogContentText>
        </DialogContent>
      </Container>
      <Container>
        <DialogActions>
          <Button onClick={handleStartNewRound} color="primary" variant="outlined" >Start Next Round</Button>
        </DialogActions>
      </Container>
    </Dialog >
  );
}