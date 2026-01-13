# Team Icons Download & Upload Scripts

Scripts to download team federation icons in SVG format and optionally upload them to S3.

## Overview

- `download-team-icons.js` - Downloads SVG icons from Wikipedia for all 48 teams, UEFA, FIFA, and World Cup logo
- `upload-icons-to-s3.js` - Uploads downloaded icons to AWS S3 bucket

## Prerequisites

For S3 upload functionality:
```bash
npm install @aws-sdk/client-s3
```

## Usage

### Step 1: Download Icons

```bash
node scripts/download-team-icons.js
```

This will:
- Create `public/icons/teams/` directory
- Download federation SVG logos for all 48 teams from Wikipedia
- Download UEFA logo (for playoff teams)
- Download FIFA logo (for intercontinental playoffs)
- Download 2026 World Cup logo
- Save all icons with sanitized filenames (e.g., `brazil.svg`, `england.svg`)

**Note**: Downloads are rate-limited (500ms between requests) to be respectful to Wikipedia servers.

### Step 2: Review Icons

Check the downloaded icons in `public/icons/teams/` to ensure quality and correctness.

### Step 3: Upload to S3 (Optional)

#### Option A: AWS Console (Manual Upload)
1. Open AWS S3 Console
2. Navigate to your bucket
3. Create folder: `icons/teams/`
4. Upload all SVG files from `public/icons/teams/`
5. Set Content-Type: `image/svg+xml`
6. Set Cache-Control: `public, max-age=31536000`

#### Option B: Programmatic Upload (Automated)

First, install AWS SDK:
```bash
npm install @aws-sdk/client-s3
```

Configure AWS credentials (one of):
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- AWS CLI credentials file (`~/.aws/credentials`)
- IAM role (if running on EC2/ECS)

Set bucket name:
```bash
export AWS_S3_BUCKET_NAME=your-bucket-name
export AWS_REGION=us-east-1  # optional, defaults to us-east-1
```

Run upload script:
```bash
node scripts/upload-icons-to-s3.js
```

## Icon Mapping

The script maps team names to their Wikipedia federation articles:

| Team | Federation Article | Filename |
|------|-------------------|----------|
| Brazil | Brazilian_Football_Confederation | brazil.svg |
| England | The_Football_Association | england.svg |
| France | French_Football_Federation | france.svg |
| ... | ... | ... |

Special icons:
- `uefa.svg` - UEFA logo (for playoff teams)
- `fifa.svg` - FIFA logo (for intercontinental playoffs)
- `worldcup2026.svg` - 2026 World Cup logo

## Troubleshooting

### Icon Not Found
If an icon fails to download:
1. Check the team name mapping in `download-team-icons.js`
2. Verify the Wikipedia article exists
3. Manually download from Wikipedia and place in `public/icons/teams/`

### S3 Upload Fails
- Verify AWS credentials are configured correctly
- Check IAM permissions (need `s3:PutObject`)
- Verify bucket name is correct
- Check bucket CORS settings if accessing from web

### Manual Wikipedia Download
If you need to manually download an icon:
1. Go to the team's federation Wikipedia page
2. Right-click the logo image
3. Select "Copy image address" (usually points to Wikimedia Commons)
4. Navigate to the SVG version if available
5. Download and save to `public/icons/teams/`

## File Structure

```
public/
└── icons/
    └── teams/
        ├── argentina.svg
        ├── australia.svg
        ├── brazil.svg
        ├── ...
        ├── uefa.svg
        ├── fifa.svg
        └── worldcup2026.svg
```

## Using Icons in App

Once uploaded to S3, reference icons in your app:

```typescript
const teamIconUrl = `https://your-bucket.s3.amazonaws.com/icons/teams/${teamName.toLowerCase().replace(/\s+/g, '-')}.svg`;
```

Or if using the database, store the icon URL in the team record:

```typescript
{
  name: 'Brazil',
  icon_url: 'https://your-bucket.s3.amazonaws.com/icons/teams/brazil.svg'
}
```
