'use client'

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { sendGroupEmailInvitations } from '@/app/actions/prode-group-actions';

interface Recipient {
  name: string;
  email: string;
}

interface EmailInvitationsTabProps {
  readonly groupId: string;
  readonly groupLogoUrl?: string;
  readonly themeColor?: string;
  readonly onSnackbar: (_message: string, _severity: 'success' | 'error') => void;
}

const MAX_RECIPIENTS = 50;

export default function EmailInvitationsTab({
  groupId,
  groupLogoUrl,
  themeColor,
  onSnackbar,
}: EmailInvitationsTabProps) {
  const t = useTranslations('groups.invite.email');
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: '', email: '' }]);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addRow = () => {
    setRecipients(prev => [...prev, { name: '', email: '' }]);
  };

  const removeRow = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof Recipient, value: string) => {
    setRecipients(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleTemplateDownload = () => {
    const csv = 'name,email\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invitation-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = (file: File) => {
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setCsvError(t('csvEmptyError'));
        return;
      }
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length === 0) {
        setCsvError(t('csvEmptyError'));
        return;
      }

      // Detect and skip header row
      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine.includes('email') && firstLine.includes('name');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      if (dataLines.length === 0) {
        setCsvError(t('csvEmptyError'));
        return;
      }

      // Determine column indices from header (or default 0=name, 1=email)
      let nameIdx = 0;
      let emailIdx = 1;
      if (hasHeader) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const eIdx = headers.findIndex(h => h === 'email');
        if (eIdx === -1) {
          setCsvError(t('csvFormatError'));
          return;
        }
        const nIdx = headers.findIndex(h => h === 'name' || h === 'nombre');
        emailIdx = eIdx;
        nameIdx = nIdx >= 0 ? nIdx : (eIdx === 0 ? 1 : 0);
      } else {
        // No header: check if second column looks like emails
        const firstData = lines[0].split(',');
        if (firstData.length >= 2 && firstData[1].includes('@')) {
          nameIdx = 0;
          emailIdx = 1;
        } else if (firstData.length >= 2 && firstData[0].includes('@')) {
          nameIdx = 1;
          emailIdx = 0;
        } else if (!firstData.some(c => c.includes('@'))) {
          setCsvError(t('csvFormatError'));
          return;
        }
      }

      const parsed: Recipient[] = [];
      const seenEmails = new Set<string>();
      for (const line of dataLines) {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const email = cols[emailIdx] ?? '';
        const name = cols[nameIdx] ?? '';
        if (!email) continue;
        const emailLower = email.toLowerCase();
        if (seenEmails.has(emailLower)) continue;
        seenEmails.add(emailLower);
        parsed.push({ name, email });
      }

      if (parsed.length === 0) {
        setCsvError(t('csvEmptyError'));
        return;
      }

      setRecipients(parsed);
    };
    reader.readAsText(file);
  };

  const handleSend = async () => {
    const filledRecipients = recipients.filter(r => r.email.trim());
    if (filledRecipients.length === 0) return;

    // Deduplicate by email
    const seen = new Set<string>();
    const unique = filledRecipients.filter(r => {
      const key = r.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setIsSending(true);
    try {
      const result = await sendGroupEmailInvitations(
        groupId,
        unique,
        customMessage || undefined,
        typeof window !== 'undefined' ? document.documentElement.lang || 'es' : 'es',
        groupLogoUrl,
        themeColor,
      );

      if (result.failed.length === 0) {
        onSnackbar(t('sendSuccess', { sent: result.sent }), 'success');
      } else {
        onSnackbar(t('sendPartialError', { emails: result.failed.join(', ') }), 'error');
      }
    } catch {
      onSnackbar(t('sendError'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  const filledCount = recipients.filter(r => r.email.trim()).length;
  const isOverLimit = filledCount > MAX_RECIPIENTS;
  const isSendDisabled = isSending || filledCount === 0 || isOverLimit;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">{t('title')}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="text" startIcon={<DownloadIcon />} onClick={handleTemplateDownload}>
            {t('templateBtn')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('importCsvBtn')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvImport(file);
              e.target.value = '';
            }}
          />
        </Box>
      </Box>

      {csvError && (
        <Typography variant="caption" color="error">
          {csvError}
        </Typography>
      )}

      {/* Recipient rows */}
      {recipients.map((recipient, index) => (
        <Grid container spacing={1} key={index} alignItems="center">
          <Grid size={{ xs: 5 }}>
            <TextField
              placeholder={t('nameLabel')}
              fullWidth
              size="small"
              value={recipient.name}
              onChange={(e) => updateRow(index, 'name', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              placeholder={t('emailLabel')}
              fullWidth
              size="small"
              type="email"
              value={recipient.email}
              onChange={(e) => updateRow(index, 'email', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 1 }}>
            <IconButton
              size="small"
              color="error"
              onClick={() => removeRow(index)}
              disabled={recipients.length <= 1}
              aria-label="delete"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={addRow}
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('addRow')}
      </Button>

      <TextField
        label={t('customMessageLabel')}
        multiline
        minRows={2}
        fullWidth
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {filledCount > 0 && (
          <Chip
            label={t('recipientCount', { count: filledCount })}
            color={isOverLimit ? 'warning' : 'default'}
            size="small"
          />
        )}
        {isOverLimit && (
          <Typography variant="caption" color="warning.main">
            {t('overLimit')}
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        fullWidth
        disabled={isSendDisabled}
        onClick={handleSend}
        startIcon={isSending ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {t('sendBtn')}
      </Button>
    </Box>
  );
}
