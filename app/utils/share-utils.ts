import { toPng } from 'html-to-image'

export async function captureElement(el: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(el, { cacheBust: true, skipFonts: true, pixelRatio: 2 })
  // Convert data URL to Blob without fetch (avoids service worker interception)
  const [header, base64] = dataUrl.split(',')
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
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
