import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Container from "@mui/material/Container";

export const SessionEndingDialog = () => {
  return (
    <Dialog fullWidth open={true}>
      <DialogTitle>Game Session Ended</DialogTitle>
      <Container>
        <DialogContent>
          <DialogContentText>
            Your game session has ended due to inactivity.
          </DialogContentText>
        </DialogContent>
      </Container>
    </Dialog>
  );
}