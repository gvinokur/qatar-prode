import { toPng } from 'html-to-image'

export async function captureElement(el: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(el, { cacheBust: true, skipFonts: true })
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function shareImage(blob: Blob, text: string, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text })
    return
  }
  downloadBlob(blob, filename)
  openWhatsApp(text)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function openWhatsApp(text: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}
