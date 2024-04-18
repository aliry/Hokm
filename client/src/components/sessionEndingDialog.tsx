import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { appStateAtom } from "../gameState/gameState";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Container from "@mui/material/Container";
import { Button } from "@mui/material";

export const SessionEndingDialog = () => {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [appState] = useAtom(appStateAtom);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleExtendSession = useCallback(() => {
    // TODO: emit action to extend session
    setOpen(false);
  }, []);


  useEffect(() => {
    setOpen(appState.sessionIsTimingOut);
  }, [appState]);

  // increment timer every second and stop after 1 min
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
      if (timer + 1 >= 60) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <Dialog fullWidth open={open} onClose={handleClose}>
      <DialogTitle>Session Ending</DialogTitle>
      <Container>
        <DialogContent>
          <DialogContentText>
            {timer < 60 ? `Session will end in ${60 - timer} seconds.` : 'Session has ended.'}
          </DialogContentText>
          {timer < 60 && <Button onClick={handleExtendSession} color="primary" variant="outlined">Extend Session</Button>}
        </DialogContent>
      </Container>
    </Dialog>
  );
}