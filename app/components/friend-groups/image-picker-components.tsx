"use client";
import React, { useState, useEffect } from "react";
import {Alert, Box, Button, Grid, IconButton} from "@mui/material";
import {UploadFile, Delete, CropOriginal} from '@mui/icons-material'
import { getImageDimensions } from './image-picker-utils';

interface ImagePreviewProps {
  readonly dataUrl: string;
  readonly onClick: () => void;
  readonly onRemove: () => void;
  readonly aspectRatio?: number;
  readonly previewWidth?: number;
  readonly previewBackgroundColor?: string;
}

export function ImagePreview({
  dataUrl,
  onClick,
  onRemove,
  aspectRatio = 1,
  previewWidth:defaultPreviewWidth = 200,
  previewBackgroundColor
}: ImagePreviewProps) {
  const [previewWidth, setPreviewWidth] = useState(defaultPreviewWidth)
  const [previewHeight, setPreviewHeight] = useState(defaultPreviewWidth / aspectRatio);

  useEffect(() => {
    if(dataUrl) {
      getImageDimensions(dataUrl).then(({ width, height }) => {
        const imageAspectRatio = width / height;
        if (imageAspectRatio > aspectRatio) {
          setPreviewHeight(previewWidth / imageAspectRatio);
        } else {
          setPreviewWidth(previewHeight * imageAspectRatio);
        }
      });
    }
  }, [dataUrl, previewWidth, previewHeight, aspectRatio]);

  return (
    <Box position="relative">
      <Box
        mx="auto"
        my={4}
        bgcolor={previewBackgroundColor}
        sx={{
          position: 'relative',
          width: previewWidth,
          height: previewHeight,
          overflow: 'hidden',
          borderRadius: 2,
          cursor: 'pointer'
        }}
        onClick={onClick}
      >
        <img
          src={dataUrl}
          alt="preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill'
          }}
        />
      </Box>
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{
          position: 'absolute',
          top: -10,
          right: -10,
          bgcolor: 'error.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'error.dark',
          }
        }}
        size="small"
      >
        <Delete fontSize="small" />
      </IconButton>
    </Box>
  );
}

interface NoImagePreviewProps {
  readonly onClick: () => void;
  readonly noImageText: string;
  readonly aspectRatio?: number;
  readonly previewWidth?: number;
}

export function NoImagePreview({
  onClick,
  noImageText,
  aspectRatio = 1,
  previewWidth = 200
}: NoImagePreviewProps) {
  return (
    <Box
      height={aspectRatio ? previewWidth / aspectRatio : previewWidth}
      width={previewWidth}
      my={4}
      mx={'auto'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={4}
      p={2}
      border={'2px dashed'}
      borderColor={'info.main'}
      borderRadius={2}
      onClick={onClick}
      sx={{ cursor: 'pointer' }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CropOriginal sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
        <Alert severity='info' sx={{ bgcolor: 'background.paper' }}>{noImageText}</Alert>
      </Box>
    </Box>
  )
}

interface ImageCardProps {
  readonly dataUrl: string;
  readonly fileInput: React.RefObject<HTMLInputElement | null>;
  readonly error?: string;
  readonly onRemove: () => void;
  readonly buttonText: string;
  readonly noImageText: string;
  readonly aspectRatio?: number;
  readonly previewWidth?: number;
  readonly previewBackgroundColor?: string;
}

export function ImageCard({
  dataUrl,
  fileInput,
  error,
  onRemove,
  buttonText,
  noImageText,
  aspectRatio = 1,
  previewWidth = 200,
  previewBackgroundColor
}: ImageCardProps) {
  const openDialog = () => {
    fileInput && fileInput.current !== null
      && "click" in fileInput.current &&  fileInput.current.click()
  }

  const imagePreview = dataUrl ?
    <ImagePreview
      dataUrl={dataUrl}
      onClick={openDialog}
      onRemove={onRemove}
      aspectRatio={aspectRatio}
      previewWidth={previewWidth}
      previewBackgroundColor={previewBackgroundColor}
    /> :
    <NoImagePreview
      onClick={openDialog}
      noImageText={noImageText}
      aspectRatio={aspectRatio}
      previewWidth={previewWidth}
    />

  return (
    <Grid container p={2} size={12}>
      <Grid textAlign="center" size={12}>
        {imagePreview}
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Grid>
      <Grid textAlign="center" mt={2} size={12}>
        <Button
          startIcon={<UploadFile />}
          onClick={openDialog}
          type="button"
          variant="outlined"
          fullWidth
        >
          {buttonText}
        </Button>
      </Grid>
    </Grid>
  );
} 