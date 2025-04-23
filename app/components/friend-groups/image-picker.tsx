"use client";
import React, { useState, useRef, useEffect } from "react";
import {Alert, Box, Button, Grid, IconButton, Input, Paper, Typography} from "@mui/material";
import {UploadFile, Delete, CropOriginal} from '@mui/icons-material'

interface ImagePickerProps {
  id: string;
  name: string;
  showCard?: boolean;
  defaultValue?: string;
  onChange: (event: any) => void;
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

function generateDataUrl(file: File, callback: (imageUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result as string);
  reader.readAsDataURL(file);
}

// Extract the image size getting functionality into a separate function
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new Error("Could not load image to get dimensions"));
    };
    img.src = imageUrl;
  });
}

function ImagePreview({
  dataUrl,
  onClick,
  onRemove,
  aspectRatio = 1,
  previewWidth:defaultPreviewWidth = 200,
  previewBackgroundColor
}: {
  readonly dataUrl: string,
  readonly onClick: () => void,
  readonly onRemove: () => void,
  readonly aspectRatio?: number,
  readonly previewWidth?: number
  readonly previewBackgroundColor?: string
}) {
  const [previewWidth, setPreviewWidth] = useState(defaultPreviewWidth)
  const [previewHeight, setPreviewHeight] = useState(defaultPreviewWidth / aspectRatio);

  useEffect(() => {
    if(dataUrl) {
      getImageDimensions(dataUrl).then(({ width, height }) => {
        const imageAspectRatio = width / height;
        if (imageAspectRatio > aspectRatio) {
          console.log("Image is wider than expected aspect ratio. Adjusting height.", aspectRatio);
          setPreviewHeight(previewWidth / imageAspectRatio);
        //   setWidth(height * imageAspectRatio);
        } else {
          console.log("Image is taller than expected aspect ratio. Adjusting width.");
          setPreviewWidth(previewHeight * imageAspectRatio);
        //   setHeight(width / imageAspectRatio);
        }
      });
    }
  }, [dataUrl, previewWidth, previewHeight]);

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

function NoImagePreview({
  onClick,
  noImageText,
  aspectRatio = 1,
  previewWidth = 200
}: {
  readonly onClick: () => void,
  readonly noImageText: string,
  readonly aspectRatio?: number,
  readonly previewWidth?: number
}) {
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
        <Alert severity={'info'} sx={{ bgcolor: 'background.paper' }}>{noImageText}</Alert>
      </Box>
    </Box>
  )
}

function ImageCard({
  dataUrl,
  fileInput,
  error,
  onRemove,
  buttonText,
  noImageText,
  aspectRatio = 1,
  previewWidth = 200,
  previewBackgroundColor
}: {
  readonly dataUrl: string;
  readonly fileInput: React.RefObject<HTMLInputElement>;
  readonly error?: string;
  readonly onRemove: () => void;
  readonly buttonText: string;
  readonly noImageText: string;
  readonly aspectRatio?: number;
  readonly previewWidth?: number;
  readonly previewBackgroundColor?: string;
}) {
  const openDialog = () => {
    fileInput.current?.click()
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
    <Grid container xs={12} p={2}>
      <Grid item xs={12} textAlign={"center"}>
        {imagePreview}
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Grid>
      <Grid item xs={12} textAlign={"center"} mt={2}>
        <Button
          startIcon={<UploadFile />}
          onClick={openDialog}
          type="button"
          variant={'outlined'}
          fullWidth
        >
          {buttonText}
        </Button>
      </Grid>
    </Grid>
  );
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(defaultValue ?? null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Set default texts based on imageType if not provided
  const finalButtonText = buttonText || `Seleccionar ${imageType}`;
  const finalNoImageText = noImageText || `No ${imageType.toLowerCase()} selected`;

  // Create a custom event to pass to onChange when removing the image
  const createEmptyFileEvent = () => {
    const customEvent = {
      target: {
        name,
        value: null,
        files: null,
        type: 'file',
      }
    };
    return customEvent;
  };

// Then modify the validateImageDimensions function to use async/await
  async function validateImageDimensions(imageUrl: string): Promise<string | null> {
    try {
      const {width, height} = await getImageDimensions(imageUrl);

      const actualRatio = width / height;
      const minValidRatio = aspectRatio * (1 - aspectRatioTolerance);
      const maxValidRatio = aspectRatio * (1 + aspectRatioTolerance);

      if (actualRatio < minValidRatio || actualRatio > maxValidRatio) {
        // Calculate expected dimensions based on width
        const expectedHeight = Math.round(width / aspectRatio);
        return `La imagen no tiene la proporción esperada. La proporción debe ser aproximadamente ${aspectRatio}:1 (ancho:alto). Para esta imagen, una altura de ${expectedHeight}px sería ideal.`;
      } else {
        return null;
      }
    } catch (error) {
      return "No se pudo cargar la imagen para validar sus dimensiones.";
    }
  }

  const validateFile = async (file: File): Promise<string | null> => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeInMB) {
      return `El archivo es demasiado grande. El tamaño máximo es ${maxSizeInMB}MB.`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.map(type => type.replace('image/', '')).join(', ')}`;
    }

    return validateImageDimensions(URL.createObjectURL(file));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      const validationError = await validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        // Reset the input
        if (fileInput.current) {
          fileInput.current.value = '';
        }
        return;
      }

      setFile(selectedFile);
      generateDataUrl(selectedFile, setDataUrl);
      onChange(e);
    }
  };

  const handleRemoveImage = () => {
    setDataUrl(null);
    setFile(null);
    setError(null);

    // Reset the input
    if (fileInput.current) {
      fileInput.current.value = '';
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
          accept={allowedTypes.join(',')}
          style={{ display: 'none' }}
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
