"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import {Alert, Box, Button, Grid, Input, Paper, Typography} from "@mui/material";
import {UploadFile} from '@mui/icons-material'
import {bgcolor} from "@mui/system";

interface ImagePickerProps {
  id: string;
  name: string;
  label: string;
  showCard?: boolean;
  defaultValue?: string;
  onChange: (event: any) => void;
  onBlur: () => void;
}

function generateDataUrl(file: File, callback: (imageUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result as string);
  reader.readAsDataURL(file);
}

function ImagePreview({ dataUrl, onClick }: { readonly dataUrl: string, readonly onClick: () => void}) {
  return (
    <img
      src={dataUrl}
      alt="preview"
      height={200}
      width={200}
      onClick={onClick}
      style={{
        borderRadius: 10
      }}
    />
  );
}

function NoImagePreview({onClick}: {readonly onClick: () => void}) {
  return (
    <Box
      height={200}
      width={200}
      my={4}
      display="flex"
      alignItems="center"
      gap={4}
      p={2}
      border={'2px dashed'}
      borderColor={'info.main'}
      borderRadius={2}
      onClick={onClick}
    >
      <Alert severity={'info'} sx={{ bgcolor: 'background.paper' }}>No image selected</Alert>
    </Box>
  )
}

function ImageCard({
                     dataUrl,
                     fileInput,
                   }: {
  readonly dataUrl: string;
  readonly fileInput: React.RefObject<HTMLInputElement>;
}) {
  const openDialog = () => {
    fileInput.current?.click()
  }

  const imagePreview = dataUrl ?
    <ImagePreview dataUrl={dataUrl} onClick={openDialog}/> :
    <NoImagePreview onClick={openDialog}/>

  return (
    <Grid container xs={12} p={2}>
      <Grid item xs={12} textAlign={"center"}>
        {imagePreview}
      </Grid>
      <Grid item xs={12} textAlign={"center"}>
        <Button
          startIcon={<UploadFile />}
          onClick={openDialog}
          className="w-full absolute inset-0"
          type="button"
        >Seleccionar Logo</Button>
      </Grid>
    </Grid>
  );
}

/**
 * There is some bug and this cannot be used inside of a form :(
 * @param id
 * @param name
 * @param label
 * @param defaultValue
 * @constructor
 */
export default function ImagePicker({
                                      id,
                                      name,
                                      label,
                                      defaultValue,
                                      onChange,
                                      onBlur,
                                    }: Readonly<ImagePickerProps>) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(defaultValue ?? null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) generateDataUrl(file, setDataUrl);
    onChange(e);
  };

  return (
    <React.Fragment>
      <Box sx={{ display: 'none'}}>
        <input
          type="file"
          id={id}
          name={name}
          onChange={handleFileChange}
          onBlur={onBlur}
          ref={fileInput}
          accept="image/*"
        />
      </Box>
      <ImageCard dataUrl={dataUrl ?? ""} fileInput={fileInput} />
    </React.Fragment>
  );
}
