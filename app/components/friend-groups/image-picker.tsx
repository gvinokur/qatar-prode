"use client";
import React, { useState, useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { generateDataUrl } from './image-picker-utils';
import { validateFile } from './image-validate-file';
import { ImageCard } from './image-picker-components';

interface ImagePickerProps {
  id: string;
  name: string;
  showCard?: boolean;
  defaultValue?: string;
  onChange: (_event: any) => void;
  onBlur: () => void;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  buttonText?: string;
  noImageText?: string;
  imageType?: string; // What kind of image is being uploaded (e.g., "Logo", "Profile Picture", "Cover Image")
  aspectRatio?: number; // Expected aspect ratio (width/height), default is 1 (square)
  aspectRatioTolerance?: number; // Tolerance for aspect ratio validation (0.1 = 10% tolerance)
  previewWidth?: number; // Width of the preview image in pixels
  previewBackgroundColor?: string; // Background color of the preview box
}

export default function ImagePicker({
  id,
  name,
  defaultValue,
  onChange,
  onBlur,
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  buttonText,
  noImageText,
  imageType = "image",
  aspectRatio = 1, // Default to 1:1 (square)
  aspectRatioTolerance = 0.1, // Default 10% tolerance
  previewWidth = 200, // Default preview width of 200px
  previewBackgroundColor, // background color for the preview box
}: Readonly<ImagePickerProps>) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(defaultValue ?? null);
  const [error, setError] = useState<string | null>(null);

  // Set default texts based on imageType if not provided
  const finalButtonText = buttonText || `Seleccionar ${imageType}`;
  const finalNoImageText = noImageText || `No ${imageType?.toLowerCase()} selected`;

  // Create a custom event to pass to onChange when removing the image
  const createEmptyFileEvent = () => {
    const customEvent = {
      target: {
        name,
        value: null,
        files: [],
        type: 'file',
      }
    };
    return customEvent;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      const validationError = await validateFile(
        selectedFile, 
        maxSizeInMB, 
        allowedTypes, 
        aspectRatio, 
        aspectRatioTolerance
      );

      if (validationError) {
        setError(validationError);
        // Reset the input
        if (fileInput && fileInput.current) {
          if ("value" in fileInput.current) {
            fileInput.current.value = '';
          }
        }
        return;
      }

      generateDataUrl(selectedFile, setDataUrl);
      onChange(e);
    }
  };

  const handleRemoveImage = () => {
    setDataUrl(null);
    setError(null);

    // Reset the input
    if (fileInput.current) {
      if ("value" in fileInput.current) {
        fileInput.current.value = '';
      }
    }

    // Notify parent component
    onChange(createEmptyFileEvent());
  };

  // If defaultValue changes externally, update the preview
  useEffect(() => {
    if (defaultValue) {
      setDataUrl(defaultValue);
    }
  }, [defaultValue]);

  return (
    <React.Fragment>
      <Box>
        <input
          type="file"
          id={id}
          name={name}
          onChange={handleFileChange}
          onBlur={onBlur}
          ref={fileInput}
          accept={allowedTypes?.join(',')}
          style={{ display: 'none' }}
          data-testid="file-input"
        />
      </Box>
      <ImageCard
        dataUrl={dataUrl ?? ""}
        fileInput={fileInput}
        error={error ?? undefined}
        onRemove={handleRemoveImage}
        buttonText={finalButtonText}
        noImageText={finalNoImageText}
        aspectRatio={aspectRatio}
        previewWidth={previewWidth}
        previewBackgroundColor={previewBackgroundColor}
      />
      {aspectRatio !== 1 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          Proporción de imagen recomendada: {aspectRatio}:1
        </Typography>
      )}
    </React.Fragment>
  );
}
