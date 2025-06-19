import { validateImageDimensions } from './image-picker-utils';

export async function validateFile(
  file: File, 
  maxSizeInMB: number, 
  allowedTypes: string[], 
  aspectRatio: number, 
  aspectRatioTolerance: number
): Promise<string | null> {
  // Check file size
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeInMB) {
    return `El archivo es demasiado grande. El tamaño máximo es ${maxSizeInMB}MB.`;
  }

  // Check file type
  if (!allowedTypes?.includes(file.type)) {
    return `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes?.map(type => type.replace('image/', '')).join(', ')}`;
  }

  return validateImageDimensions(URL.createObjectURL(file), aspectRatio, aspectRatioTolerance);
} 