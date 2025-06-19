// Utility functions for image processing and validation

export function generateDataUrl(file: File, callback: (_imageUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result as string);
  reader.readAsDataURL(file);
}

export async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
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

export async function validateImageDimensions(
  imageUrl: string, 
  aspectRatio: number, 
  aspectRatioTolerance: number
): Promise<string | null> {
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
  } catch {
    return "No se pudo cargar la imagen para validar sus dimensiones.";
  }
} 