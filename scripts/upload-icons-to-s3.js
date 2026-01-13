#!/usr/bin/env node

/**
 * Upload team icons to S3
 *
 * Uploads all SVG icons from public/icons/teams to S3 bucket
 * Requires AWS credentials to be configured
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons', 'teams');
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'your-bucket-name';
const S3_PREFIX = 'icons/teams/'; // Path in S3 bucket

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Upload a file to S3
 */
async function uploadFileToS3(filepath, s3Key) {
  const fileContent = fs.readFileSync(filepath);
  const filename = path.basename(filepath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'image/svg+xml',
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  });

  try {
    await s3Client.send(command);
    console.log(`✓ Uploaded: ${filename}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to upload ${filename}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  // Check if directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Error: Icons directory not found: ${ICONS_DIR}`);
    console.error('Run "node scripts/download-team-icons.js" first to download icons.');
    process.exit(1);
  }

  // Check if bucket name is configured
  if (BUCKET_NAME === 'your-bucket-name') {
    console.error('Error: AWS_S3_BUCKET_NAME environment variable not set.');
    console.error('Set it with: export AWS_S3_BUCKET_NAME=your-bucket-name');
    process.exit(1);
  }

  console.log('Starting S3 upload...\n');
  console.log(`Source: ${ICONS_DIR}`);
  console.log(`Destination: s3://${BUCKET_NAME}/${S3_PREFIX}`);
  console.log('');

  // Get all SVG files
  const files = fs.readdirSync(ICONS_DIR).filter(file => file.endsWith('.svg'));

  if (files.length === 0) {
    console.error('No SVG files found in icons directory.');
    process.exit(1);
  }

  console.log(`Found ${files.length} icons to upload.\n`);

  let successCount = 0;
  let failCount = 0;

  // Upload each file
  for (const file of files) {
    const filepath = path.join(ICONS_DIR, file);
    const s3Key = S3_PREFIX + file;

    const success = await uploadFileToS3(filepath, s3Key);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=== Upload Summary ===');
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`\nIcons available at: https://${BUCKET_NAME}.s3.amazonaws.com/${S3_PREFIX}`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
