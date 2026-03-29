import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  if (!clientId) {
    return new NextResponse('', { status: 404 })
  }

  return new NextResponse(
    `google.com, ${clientId}, DIRECT, f08c47fec0942fa0\n`,
    {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  )
}
