#!/usr/bin/env node

/**
 * Download team federation icons from Wikipedia
 *
 * Downloads SVG icons for all 2026 World Cup teams, plus:
 * - UEFA logo (for playoff teams)
 * - FIFA logo (for intercontinental playoffs)
 * - World Cup 2026 logo
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons', 'teams');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  console.log(`Created directory: ${ICONS_DIR}`);
}

/**
 * Team name to Wikipedia federation mapping
 * Some teams need special handling for their Wikipedia article names
 */
const teamToFederation = {
  // Group A
  'Mexico': 'Mexican_Football_Federation',
  'South Korea': 'Korea_Football_Association',
  'South Africa': 'South_African_Football_Association',

  // Group B
  'Canada': 'Canadian_Soccer_Association',
  'Switzerland': 'Swiss_Football_Association',
  'Qatar': 'Qatar_Football_Association',

  // Group C
  'Brazil': 'Brazilian_Football_Confederation',
  'Morocco': 'Royal_Moroccan_Football_Federation',
  'Scotland': 'Scottish_Football_Association',
  'Haiti': 'Haitian_Football_Federation',

  // Group D
  'USA': 'United_States_Soccer_Federation',
  'Australia': 'Football_Australia',
  'Paraguay': 'Paraguayan_Football_Association',

  // Group E
  'Germany': 'German_Football_Association',
  'Ecuador': 'Ecuadorian_Football_Federation',
  'Ivory Coast': 'Ivorian_Football_Federation',
  'Curaçao': 'Curaçao_Football_Federation',

  // Group F
  'Netherlands': 'Royal_Dutch_Football_Association',
  'Japan': 'Japan_Football_Association',
  'Tunisia': 'Tunisian_Football_Federation',

  // Group G
  'Belgium': 'Royal_Belgian_Football_Association',
  'Iran': 'Football_Federation_Islamic_Republic_of_Iran',
  'Egypt': 'Egyptian_Football_Association',
  'New Zealand': 'New_Zealand_Football',

  // Group H
  'Spain': 'Royal_Spanish_Football_Federation',
  'Uruguay': 'Uruguayan_Football_Association',
  'Saudi Arabia': 'Saudi_Arabian_Football_Federation',
  'Cape Verde': 'Cape_Verdean_Football_Federation',

  // Group I
  'France': 'French_Football_Federation',
  'Senegal': 'Senegalese_Football_Federation',
  'Norway': 'Football_Association_of_Norway',

  // Group J
  'Argentina': 'Argentine_Football_Association',
  'Austria': 'Austrian_Football_Association',
  'Algeria': 'Algerian_Football_Federation',
  'Jordan': 'Jordan_Football_Association',

  // Group K
  'Portugal': 'Portuguese_Football_Federation',
  'Colombia': 'Colombian_Football_Federation',
  'Uzbekistan': 'Uzbekistan_Football_Association',

  // Group L
  'England': 'The_Football_Association',
  'Croatia': 'Croatian_Football_Federation',
  'Panama': 'Panamanian_Football_Federation',
  'Ghana': 'Ghana_Football_Association',
};

// Special icons
const specialIcons = {
  'UEFA': 'UEFA',
  'FIFA': 'FIFA',
  'WorldCup2026': '2026_FIFA_World_Cup'
};

/**
 * Fetch Wikipedia page to find SVG logo URL
 */
async function fetchWikipediaLogoUrl(articleName) {
  const fetchOptions = {
    headers: {
      'User-Agent': 'Qatar-Prode-Icon-Downloader/1.0 (https://github.com/qatar-prode; educational-use)',
      'Accept': 'application/json'
    }
  };

  try {
    // First, get the page HTML to find the logo image
    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(articleName)}&prop=text&format=json`;
    const parseResponse = await fetch(parseUrl, fetchOptions);
    const parseData = await parseResponse.json();

    if (!parseData.parse || !parseData.parse.text) {
      return null;
    }

    const html = parseData.parse.text['*'];

    // Try to find SVG file in the infobox
    // Look for upload.wikimedia.org URLs ending in .svg
    const svgMatches = html.match(/\/\/upload\.wikimedia\.org\/wikipedia\/[^"'\s]+\.svg/gi);

    if (svgMatches && svgMatches.length > 0) {
      // Return the first SVG found (usually the logo in the infobox)
      let svgUrl = 'https:' + svgMatches[0];

      // Remove any thumbnail sizing from the URL
      svgUrl = svgUrl.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');

      return svgUrl;
    }

    // Fallback: try to get any image and look for SVG version
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleName)}&prop=images&format=json`;
    const imageResponse = await fetch(imageUrl, fetchOptions);
    const imageData = await imageResponse.json();
    const pages = imageData.query.pages;
    const page = Object.values(pages)[0];

    if (page.images && page.images.length > 0) {
      // Find first SVG image
      const svgImage = page.images.find(img => img.title.toLowerCase().endsWith('.svg'));
      if (svgImage) {
        // Get the actual file URL
        const fileUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(svgImage.title)}&prop=imageinfo&iiprop=url&format=json`;
        const fileResponse = await fetch(fileUrl, fetchOptions);
        const fileData = await fileResponse.json();
        const filePages = fileData.query.pages;
        const filePage = Object.values(filePages)[0];

        if (filePage.imageinfo && filePage.imageinfo[0]) {
          return filePage.imageinfo[0].url;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching Wikipedia logo for ${articleName}:`, error.message);
    return null;
  }
}

/**
 * Download file from URL
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    const options = {
      headers: {
        'User-Agent': 'Qatar-Prode-Icon-Downloader/1.0 (https://github.com/qatar-prode; educational-use)',
        'Accept': 'image/svg+xml,image/*,*/*'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * Download icon for a team
 */
async function downloadTeamIcon(teamName, federationName) {
  const filename = `${sanitizeFilename(teamName)}.svg`;
  const filepath = path.join(ICONS_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`✓ ${teamName} (already exists)`);
    return;
  }

  console.log(`Downloading ${teamName}...`);

  const logoUrl = await fetchWikipediaLogoUrl(federationName);

  if (!logoUrl) {
    console.error(`✗ ${teamName}: Could not find logo URL`);
    return;
  }

  try {
    await downloadFile(logoUrl, filepath);
    console.log(`✓ ${teamName}`);
  } catch (error) {
    console.error(`✗ ${teamName}: ${error.message}`);
  }
}

/**
 * Download special icon (UEFA, FIFA, World Cup)
 */
async function downloadSpecialIcon(name, wikipediaArticle) {
  const filename = `${sanitizeFilename(name)}.svg`;
  const filepath = path.join(ICONS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.log(`✓ ${name} (already exists)`);
    return;
  }

  console.log(`Downloading ${name}...`);

  const logoUrl = await fetchWikipediaLogoUrl(wikipediaArticle);

  if (!logoUrl) {
    console.error(`✗ ${name}: Could not find logo URL`);
    return;
  }

  try {
    await downloadFile(logoUrl, filepath);
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting team icon downloads...\n');
  console.log(`Saving icons to: ${ICONS_DIR}\n`);

  // Download team icons
  console.log('=== Team Federation Icons ===');
  for (const [teamName, federationName] of Object.entries(teamToFederation)) {
    await downloadTeamIcon(teamName, federationName);
    // Rate limit to be nice to Wikipedia
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n=== Special Icons ===');
  // Download special icons
  for (const [name, article] of Object.entries(specialIcons)) {
    await downloadSpecialIcon(name, article);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✓ Download complete!');
  console.log(`\nIcons saved to: ${ICONS_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Review the downloaded icons');
  console.log('2. Upload to S3 using the AWS console or run: node scripts/upload-icons-to-s3.js');
}

main().catch(console.error);
