"use client";

import React, { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { leaveGroupAction } from "../../actions/prode-group-actions";

export default function LeaveGroupButton({ groupId }: { readonly groupId: string }) {
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLeave = async () => {
    setLoading(true);
    try {
      await leaveGroupAction(groupId);
      setSnackbar({ open: true, message: "Has dejado el grupo exitosamente.", severity: "success" });
      setTimeout(() => router.push("/"), 1200);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || "Error al dejar el grupo.", severity: "error" });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button color="error" variant="outlined" onClick={() => setOpen(true)} disabled={loading} sx={{ mt: 2 }}>
        Dejar grupo
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogContent>
          ¿Quieres dejar este grupo? Ya no podras competir con tus amigos.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleLeave} color="error" disabled={loading} autoFocus>
            Sí, dejar grupo
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}