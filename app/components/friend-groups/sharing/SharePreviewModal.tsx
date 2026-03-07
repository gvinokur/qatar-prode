'use client'

import { useState, useEffect, type RefObject } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { captureElement, downloadBlob, openWhatsApp, shareImage } from '../../../utils/share-utils'

export interface SharePreviewModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly templateRef: RefObject<HTMLElement | null>
  readonly shareText: string
  readonly filename: string
}

export default function SharePreviewModal({
  open,
  onClose,
  templateRef,
  shareText,
  filename,
}: SharePreviewModalProps) {
  const t = useTranslations('groups.sharing')

  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    if (!open) {
      setDataUrl(null)
      setBlob(null)
      setCaptureError(null)
      return
    }

    const file = new File([new Blob()], filename, { type: 'image/png' })
    setCanNativeShare(!!navigator.canShare?.({ files: [file] }))

    if (!templateRef.current) return

    setIsCapturing(true)
    captureElement(templateRef.current)
      .then((capturedBlob) => {
        setBlob(capturedBlob)
        setDataUrl(URL.createObjectURL(capturedBlob))
      })
      .catch(() => {
        setCaptureError(t('captureError'))
      })
      .finally(() => {
        setIsCapturing(false)
      })
  }, [open, templateRef, filename, t])

  // Revoke object URL on unmount / change
  useEffect(() => {
    return () => {
      if (dataUrl) URL.revokeObjectURL(dataUrl)
    }
  }, [dataUrl])

  function handleShare() {
    if (!blob) return
    shareImage(blob, shareText, filename).catch(() => {
      // Fallback already handled inside shareImage
    })
  }

  function handleDownload() {
    if (!blob) return
    downloadBlob(blob, filename)
  }

  function handleWhatsApp() {
    openWhatsApp(shareText)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('previewTitle')}</DialogTitle>

      <DialogContent>
        {isCapturing && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              {t('generatingImage')}
            </Typography>
          </Box>
        )}

        {captureError && (
          <Typography color="error" sx={{ py: 2, textAlign: 'center' }}>
            {captureError}
          </Typography>
        )}

        {dataUrl && !isCapturing && (
          <Box>
            <Box
              component="img"
              src={dataUrl}
              alt="Share preview"
              sx={{ width: '100%', borderRadius: 1, display: 'block' }}
            />
            {!canNativeShare && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('desktopHint')}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="outlined" size="small">
          {t('cancel')}
        </Button>

        {dataUrl && !isCapturing && (
          <>
            <Button
              onClick={handleDownload}
              variant="outlined"
              size="small"
              disabled={!blob}
            >
              {t('download')}
            </Button>

            {canNativeShare ? (
              <Button
                onClick={handleShare}
                variant="contained"
                size="small"
                disabled={!blob}
              >
                {t('shareButton')}
              </Button>
            ) : (
              <Button
                onClick={handleWhatsApp}
                variant="contained"
                color="success"
                size="small"
              >
                {t('openWhatsApp')}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
