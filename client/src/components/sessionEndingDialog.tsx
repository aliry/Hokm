import { useCallback, useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Container from "@mui/material/Container";
import { Button } from "@mui/material";
import { useGetGameState } from "../gameState/gameHooks";

export const SessionEndingDialog = () => {
  const [open, setOpen] = useState(true);
  const [timer, setTimer] = useState<number>(0);
  const extendSession = useGetGameState();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleExtendSession = useCallback(() => {
    extendSession();
    setOpen(false);
  }, [extendSession]);

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