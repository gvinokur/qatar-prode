"use client";

import React, { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { leaveGroupAction } from "../../actions/prode-group-actions";
import { useLocale, useTranslations } from 'next-intl';

export default function LeaveGroupButton({ groupId }: { readonly groupId: string }) {
  const locale = useLocale();
  const t = useTranslations('groups.leave');
  const tCommon = useTranslations('common.buttons');

  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLeave = async () => {
    setLoading(true);
    try {
      await leaveGroupAction(groupId);
      setSnackbar({ open: true, message: t('feedback.success'), severity: "success" });
      setTimeout(() => router.push(`/${locale}`), 1200);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || t('feedback.error'), severity: "error" });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button color="error" variant="outlined" onClick={() => setOpen(true)} disabled={loading} sx={{ mt: 2 }}>
        {t('button')}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{t('confirmation.title')}</DialogTitle>
        <DialogContent>
          {t('confirmation.message')}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>{tCommon('cancel')}</Button>
          <Button onClick={handleLeave} color="error" disabled={loading} autoFocus>
            {t('button')}
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