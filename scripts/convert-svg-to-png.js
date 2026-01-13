const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Convert all SVG team icons to PNG format
 * Uses the sharp library for high-quality conversion
 */

const iconsDir = path.join(__dirname, '../public/icons/teams');
const PNG_WIDTH = 1000; // Output PNG width in pixels

async function convertSVGtoPNG(svgPath, pngPath) {
  try {
    await sharp(svgPath, { density: 300 })
      .resize(PNG_WIDTH, null, {
        fit: 'inside',
        withoutEnlargement: false
      })
      .png()
      .toFile(pngPath);
    return true;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return false;
  }
}

async function convertAllSVGs() {
  console.log('SVG to PNG Converter');
  console.log(`Output size: ${PNG_WIDTH}px width\n`);

  // Get all SVG files
  const files = fs.readdirSync(iconsDir);
  const svgFiles = files.filter(file => file.endsWith('.svg'));

  console.log(`Found ${svgFiles.length} SVG files\n`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const svgFile of svgFiles) {
    const baseName = path.basename(svgFile, '.svg');
    const svgPath = path.join(iconsDir, svgFile);
    const pngPath = path.join(iconsDir, `${baseName}.png`);

    // Check if PNG already exists
    if (fs.existsSync(pngPath)) {
      console.log(`⏭  ${baseName}: PNG already exists, skipping`);
      skipped++;
      continue;
    }

    console.log(`🔄 Converting ${baseName}...`);
    const success = await convertSVGtoPNG(svgPath, pngPath);

    if (success) {
      const stats = fs.statSync(pngPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✅ ${baseName}: Converted successfully (${sizeMB} MB)`);
      converted++;
    } else {
      console.log(`❌ ${baseName}: Conversion failed`);
      failed++;
    }
  }

  console.log(`\n=== Conversion Summary ===`);
  console.log(`Total SVG files: ${svgFiles.length}`);
  console.log(`Converted: ${converted}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Failed: ${failed}`);

  // List all PNG files after conversion
  const allPngs = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));
  console.log(`\nTotal PNG files now: ${allPngs.length}`);
}

convertAllSVGs().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
