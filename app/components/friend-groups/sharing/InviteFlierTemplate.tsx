'use client'

import React from 'react'
import { Avatar, Skeleton } from '@mui/material'
import { QRCodeSVG } from 'qrcode.react'

const DEFAULT_THEME_COLOR = '#7c3aed'
const FLIER_WIDTH = 360
const FLIER_HEIGHT = 480

export interface InviteFlierTemplateProps {
  groupName: string
  groupLogoUrl?: string
  customMessage: string
  shortUrl: string
  themeColor?: string
  loading?: boolean
}

const InviteFlierTemplate = React.forwardRef<HTMLDivElement, InviteFlierTemplateProps>(
  function InviteFlierTemplate(
    { groupName, groupLogoUrl, customMessage, shortUrl, themeColor = DEFAULT_THEME_COLOR, loading = false },
    ref
  ) {
    const initials = groupName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()

    const avatarElement = loading ? (
      <Skeleton variant="circular" width={72} height={72} />
    ) : groupLogoUrl ? (
      <img
        src={groupLogoUrl}
        alt={groupName}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: '3px solid #fff',
          objectFit: 'cover',
        }}
      />
    ) : (
      <Avatar
        sx={{
          width: 72,
          height: 72,
          fontSize: 28,
          fontWeight: 700,
          bgcolor: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: '3px solid #fff',
        }}
      >
        {initials}
      </Avatar>
    )

    return (
      <div
        ref={ref}
        style={{
          width: FLIER_WIDTH,
          height: FLIER_HEIGHT,
          background: `linear-gradient(135deg, ${themeColor} 0%, #000 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px 24px 24px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {avatarElement}

          {/* Group name */}
          {loading ? (
            <Skeleton variant="text" width={160} height={32} />
          ) : (
            <p
              style={{
                margin: 0,
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {groupName}
            </p>
          )}

          {/* Custom message */}
          {loading ? (
            <Skeleton variant="text" width={220} height={52} />
          ) : (
            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,0.9)',
                fontSize: 14,
                fontStyle: 'italic',
                textAlign: 'center',
                lineHeight: 1.4,
                maxWidth: 280,
              }}
            >
              {customMessage}
            </p>
          )}
        </div>

        {/* QR + URL */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loading ? (
            <Skeleton variant="rectangular" width={100} height={100} />
          ) : (
            <QRCodeSVG value={shortUrl} size={100} />
          )}
          {loading ? (
            <Skeleton variant="text" width={140} height={18} />
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#555',
                textAlign: 'center',
                wordBreak: 'break-all',
                maxWidth: 200,
              }}
            >
              {shortUrl}
            </p>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            margin: 0,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          PRODE MUNDIAL
        </p>
      </div>
    )
  }
)

export default InviteFlierTemplate
