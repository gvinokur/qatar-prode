import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxies external images (e.g. group logos from S3) so that html-to-image can
 * inline them without hitting cross-origin fetch restrictions.  The img src in
 * InviteFlierTemplate is rewritten to this same-origin URL.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Only proxy https URLs to limit SSRF surface
  if (!url.startsWith('https://')) {
    return new NextResponse('Only https URLs are supported', { status: 400 })
  }

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) {
      return new NextResponse('Upstream fetch failed', { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch image', { status: 502 })
  }
}
