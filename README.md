# Qatar Prode - Sports Prediction Platform

A sophisticated sports prediction platform built with Next.js, designed for managing and participating in sports tournament predictions. The platform supports tournament management, game predictions, user groups, and comprehensive statistics tracking.

## Features

- **User Management**
  - Secure authentication and authorization
  - Email verification system
  - Password reset functionality
  - User profiles with nicknames
  - Admin user roles

- **Tournament Management**
  - Multiple tournament support
  - Group stage and playoff rounds
  - Tournament-specific settings and themes
  - Comprehensive statistics and standings

- **Game Predictions**
  - Real-time game predictions
  - Support for regular time and penalty shootouts
  - Scoring system
  - Historical game data

- **Team & Player Management**
  - Team profiles with themes
  - Player statistics and awards
  - Best player/goalkeeper tracking
  - Top goalscorer tracking

- **Social Features**
  - Friend groups
  - Group-based predictions
  - Group standings and statistics

- **Progressive Web App**
  - Offline support
  - Push notifications
  - Mobile-friendly interface

## Tech Stack

- Next.js 15.x
- TypeScript
- Material-UI (MUI) v7
- PostgreSQL
- NextAuth.js
- Progressive Web App (PWA) support

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
# Required environment variables
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/qatar_prode

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (for notifications and password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@example.com

# AWS S3 Configuration (for file storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_BUCKET_NAME=your-bucket-name

# Web Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Qatar Prode
NEXT_PUBLIC_APP_DESCRIPTION=Sports Prediction Platform
```

### Configuration Files

#### next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental HTTPS in development
  experimental: {
    https: true
  },
  // Configure image domains if using external images
  images: {
    domains: ['your-image-domain.com']
  }
}

export default nextConfig
```

#### tsconfig.json
The project uses TypeScript with strict mode enabled. Key configurations include:
- `strict: true`
- `jsx: "preserve"`
- `incremental: true`
- `esModuleInterop: true`

#### jest.config.ts
Jest is configured for testing with:
- JSDOM environment
- TypeScript support
- Coverage reporting
- Test file patterns

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Database

The project uses PostgreSQL with a comprehensive schema supporting:
- User management
- Tournament organization
- Game predictions
- Team and player statistics
- Group management

## Deployment

The application is configured for deployment on Vercel. For more details, check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## License

Private project - All rights reserved
