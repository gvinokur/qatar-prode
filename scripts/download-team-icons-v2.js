#!/usr/bin/env node

/**
 * Download team federation icons from Wikipedia (IMPROVED VERSION)
 *
 * Uses Wikipedia search API to find correct pages
 * Validates we're getting team crests, not flags or other logos
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons', 'teams');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

/**
 * Country names for all 42 qualified teams
 */
const countries = [
  // Group A
  'Mexico', 'South Korea', 'South Africa',
  // Group B
  'Canada', 'Switzerland', 'Qatar',
  // Group C
  'Brazil', 'Morocco', 'Scotland', 'Haiti',
  // Group D
  'USA', 'Australia', 'Paraguay',
  // Group E
  'Germany', 'Ecuador', 'Ivory Coast', 'Curaçao',
  // Group F
  'Netherlands', 'Japan', 'Tunisia',
  // Group G
  'Belgium', 'Iran', 'Egypt', 'New Zealand',
  // Group H
  'Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde',
  // Group I
  'France', 'Senegal', 'Norway',
  // Group J
  'Argentina', 'Austria', 'Algeria', 'Jordan',
  // Group K
  'Portugal', 'Colombia', 'Uzbekistan',
  // Group L
  'England', 'Croatia', 'Panama', 'Ghana'
];

// Special icons
const specialIcons = {
  'UEFA': 'UEFA',
  'FIFA': 'FIFA',
  'WorldCup2026': '2026_FIFA_World_Cup'
};

// Map countries to their continental confederations
const countryToConfederation = {
  // AFC (Asia)
  'South Korea': 'Asian_Football_Confederation',
  'Japan': 'Asian_Football_Confederation',
  'Iran': 'Asian_Football_Confederation',
  'Saudi Arabia': 'Asian_Football_Confederation',
  'Qatar': 'Asian_Football_Confederation',
  'Uzbekistan': 'Asian_Football_Confederation',
  'Jordan': 'Asian_Football_Confederation',

  // CAF (Africa)
  'Morocco': 'Confederation_of_African_Football',
  'South Africa': 'Confederation_of_African_Football',
  'Tunisia': 'Confederation_of_African_Football',
  'Egypt': 'Confederation_of_African_Football',
  'Senegal': 'Confederation_of_African_Football',
  'Algeria': 'Confederation_of_African_Football',
  'Ghana': 'Confederation_of_African_Football',
  'Ivory Coast': 'Confederation_of_African_Football',
  'Cape Verde': 'Confederation_of_African_Football',

  // CONCACAF (North/Central America & Caribbean)
  'Mexico': 'CONCACAF',
  'USA': 'CONCACAF',
  'Canada': 'CONCACAF',
  'Haiti': 'CONCACAF',
  'Curaçao': 'CONCACAF',
  'Panama': 'CONCACAF',

  // CONMEBOL (South America)
  'Brazil': 'CONMEBOL',
  'Argentina': 'CONMEBOL',
  'Uruguay': 'CONMEBOL',
  'Colombia': 'CONMEBOL',
  'Paraguay': 'CONMEBOL',
  'Ecuador': 'CONMEBOL',

  // UEFA (Europe)
  'Germany': 'UEFA',
  'Spain': 'UEFA',
  'France': 'UEFA',
  'England': 'UEFA',
  'Portugal': 'UEFA',
  'Netherlands': 'UEFA',
  'Belgium': 'UEFA',
  'Croatia': 'UEFA',
  'Switzerland': 'UEFA',
  'Austria': 'UEFA',
  'Scotland': 'UEFA',
  'Norway': 'UEFA',

  // OFC (Oceania)
  'Australia': 'Asian_Football_Confederation', // Australia moved to AFC
  'New Zealand': 'Oceania_Football_Confederation'
};

/**
 * Find football association page via confederation member lists
 */
async function findAssociationPage(countryName) {
  const confederation = countryToConfederation[countryName];
  if (!confederation) {
    console.log(`  No confederation mapping for ${countryName}`);
    return null;
  }

  const fetchOptions = {
    headers: {
      'User-Agent': 'Qatar-Prode-Icon-Downloader/2.0 (educational-use)',
      'Accept': 'application/json'
    }
  };

  try {
    // Get the confederation page HTML
    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(confederation)}&prop=text&format=json`;
    const parseResponse = await fetch(parseUrl, fetchOptions);
    const parseData = await parseResponse.json();

    if (!parseData.parse || !parseData.parse.text) {
      return null;
    }

    const html = parseData.parse.text['*'];

    // Look for links to country's football association
    // Try different variations of the country name in the HTML
    const searchVariations = [
      countryName,
      countryName.replace(/\s+/g, '_'),
      countryName.replace(/\s+/g, '%20')
    ];

    // Add special cases for countries where association name differs
    const specialCases = {
      'South Korea': ['Korea_Football_Association', 'KFA'],
      'USA': ['United_States_Soccer', 'USSF'],
      'England': ['The_Football_Association', 'FA'],
      'Ivory Coast': ['Ivorian_Football_Federation', 'FIF']
    };

    if (specialCases[countryName]) {
      searchVariations.push(...specialCases[countryName]);
    }

    // Find links that contain the country name and "Football" or "Soccer"
    const linkPattern = /<a\s+href="\/wiki\/([^"]+)"[^>]*>([^<]*)<\/a>/gi;
    let match;

    const possibleLinks = [];

    while ((match = linkPattern.exec(html)) !== null) {
      const linkTarget = match[1];
      const linkText = match[2];

      // Check if this link is likely the football association
      for (const variant of searchVariations) {
        if (linkTarget.toLowerCase().includes(variant.toLowerCase()) &&
            (linkTarget.toLowerCase().includes('football') ||
             linkTarget.toLowerCase().includes('soccer'))) {
          // Prioritize association/federation pages over national team pages
          const isAssociation = linkTarget.toLowerCase().includes('association') ||
                                linkTarget.toLowerCase().includes('federation');
          const priority = isAssociation ? 1 : 2;
          possibleLinks.push({ link: linkTarget, priority });
          break; // Found a match for this variant, move to next link
        }
      }
    }

    if (possibleLinks.length > 0) {
      // Sort by priority (1 = association/federation, 2 = national team)
      possibleLinks.sort((a, b) => a.priority - b.priority);
      const bestLink = possibleLinks[0].link;
      return decodeURIComponent(bestLink);
    }

    console.log(`  Could not find ${countryName} in ${confederation} members`);
    return null;
  } catch (error) {
    console.error(`  Error:`, error.message);
    return null;
  }
}

/**
 * Fetch Wikipedia page and extract logo URL
 */
async function fetchLogoFromPage(pageTitle) {
  const fetchOptions = {
    headers: {
      'User-Agent': 'Qatar-Prode-Icon-Downloader/2.0 (educational-use)',
      'Accept': 'application/json'
    }
  };

  try {
    // Get page HTML
    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json`;
    const parseResponse = await fetch(parseUrl, fetchOptions);
    const parseData = await parseResponse.json();

    if (!parseData.parse || !parseData.parse.text) {
      return null;
    }

    const html = parseData.parse.text['*'];

    // Look for SVG files in the page
    // Prioritize files with logo/crest/badge/emblem in the name
    const svgMatches = html.match(/\/\/upload\.wikimedia\.org\/wikipedia\/[^"'\s]+\.svg/gi);

    if (!svgMatches || svgMatches.length === 0) {
      return null;
    }

    // Filter and prioritize SVG files
    const prioritizedSvgs = [];
    const otherSvgs = [];

    for (const match of svgMatches) {
      const filename = match.toLowerCase();
      // Extract just the filename (last part after /)
      const filenameOnly = filename.split('/').pop() || filename;

      // Skip flags (country flags, not team crests)
      if (filename.includes('flag') || filename.includes('coat_of_arms')) {
        continue;
      }

      // Skip Wikipedia/Wikimedia infrastructure icons (check filename only, not domain)
      if (filenameOnly.includes('commons-logo') ||
          filenameOnly.includes('wikidata') ||
          filenameOnly.includes('wikisource') ||
          filenameOnly.includes('wikibooks') ||
          filenameOnly.includes('wikinews') ||
          filenameOnly.includes('wiktionary') ||
          filenameOnly.includes('wikiquote') ||
          filenameOnly.includes('wikiversity') ||
          filenameOnly.includes('wikivoyage') ||
          filenameOnly.includes('question_book') ||
          filenameOnly.includes('ambox') ||
          filenameOnly.includes('edit-clear') ||
          filenameOnly.includes('folder_hexagonal') ||
          filenameOnly.includes('portal-puzzle') ||
          filenameOnly.includes('symbol_book') ||
          filenameOnly.includes('steady') ||
          filenameOnly.includes('oojs_ui_icon') ||
          filenameOnly.includes('edit-ltr') ||
          filenameOnly.includes('increase') ||
          filenameOnly.includes('decrease')) {
        continue;
      }

      // Skip kit/uniform pieces
      if (filenameOnly.includes('kit_left_arm') ||
          filenameOnly.includes('kit_right_arm') ||
          filenameOnly.includes('kit_body') ||
          filenameOnly.includes('kit_shorts') ||
          filenameOnly.includes('kit_socks')) {
        continue;
      }

      // Skip medals and generic sports icons
      if (filenameOnly.includes('medal') ||
          filenameOnly.includes('soccerball_shade') ||
          filenameOnly.includes('soccer_ball') ||
          filenameOnly.includes('soccer_field') ||
          filenameOnly.includes('lock-') ||
          filenameOnly.includes('world_map') ||
          filenameOnly.includes('globe')) {
        continue;
      }

      // Prioritize files with logo/crest/badge/emblem
      if (filename.includes('logo') || filename.includes('crest') ||
          filename.includes('badge') || filename.includes('emblem') ||
          filename.includes('association') || filename.includes('kfa') ||
          filename.includes('fmf') || filename.includes('national')) {
        prioritizedSvgs.push(match);
      } else {
        otherSvgs.push(match);
      }
    }

    // Try prioritized SVGs first, then others
    const orderedSvgs = [...prioritizedSvgs, ...otherSvgs];

    if (orderedSvgs.length > 0) {
      let svgUrl = 'https:' + orderedSvgs[0];

      // Remove thumbnail sizing
      svgUrl = svgUrl.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');

      console.log(`  Logo URL: ${svgUrl}`);
      return svgUrl;
    }

    return null;
  } catch (error) {
    console.error(`  Error fetching page:`, error.message);
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
        'User-Agent': 'Qatar-Prode-Icon-Downloader/2.0 (educational-use)',
        'Accept': 'image/svg+xml,image/*,*/*'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
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
      fs.unlink(filepath, () => {});
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
 * Download icon for a country
 */
async function downloadCountryIcon(countryName) {
  const filename = `${sanitizeFilename(countryName)}.svg`;
  const filepath = path.join(ICONS_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`✓ ${countryName} (already exists)`);
    return;
  }

  console.log(`Downloading ${countryName}...`);

  // Find association page via confederation
  const pageTitle = await findAssociationPage(countryName);

  if (!pageTitle) {
    console.error(`✗ ${countryName}: Could not find association page`);
    return;
  }

  // Extract logo from page
  const logoUrl = await fetchLogoFromPage(pageTitle);

  if (!logoUrl) {
    console.error(`✗ ${countryName}: Could not find logo on page`);
    return;
  }

  // Download the logo
  try {
    await downloadFile(logoUrl, filepath);
    console.log(`✓ ${countryName}`);
  } catch (error) {
    console.error(`✗ ${countryName}: ${error.message}`);
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

  const logoUrl = await fetchLogoFromPage(wikipediaArticle);

  if (!logoUrl) {
    console.error(`✗ ${name}: Could not find logo`);
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
  console.log('Starting team icon downloads (v2 - with search)...\n');
  console.log(`Saving icons to: ${ICONS_DIR}\n`);

  // Download team icons
  console.log('=== Team Icons (42 countries) ===');
  for (const country of countries) {
    await downloadCountryIcon(country);
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== Special Icons ===');
  // Download special icons
  for (const [name, article] of Object.entries(specialIcons)) {
    await downloadSpecialIcon(name, article);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✓ Download complete!');
  console.log(`\nIcons saved to: ${ICONS_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Review the downloaded icons (especially check for flags vs crests)');
  console.log('2. Manually fix any that are wrong');
  console.log('3. Upload to S3 using AWS console or: node scripts/upload-icons-to-s3.js');
}

main().catch(console.error);
