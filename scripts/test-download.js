#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons', 'teams');

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

async function findAssociationPage(countryName) {
  const confederation = countryToConfederation[countryName];
  if (!confederation) {
    console.log(`  No confederation mapping for ${countryName}`);
    return null;
  }

  const fetchOptions = {
    headers: {
      'User-Agent': 'Qatar-Prode/1.0',
      'Accept': 'application/json'
    }
  };

  try {
    console.log(`  Looking in confederation: ${confederation}`);

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
      console.log(`  Found association page: ${bestLink} (priority: ${possibleLinks[0].priority})`);
      return decodeURIComponent(bestLink);
    }

    console.log(`  Could not find ${countryName} in ${confederation} members`);
    return null;
  } catch (error) {
    console.error(`  Error:`, error.message);
    return null;
  }
}

async function fetchLogoFromPage(pageTitle) {
  const fetchOptions = {
    headers: {
      'User-Agent': 'Qatar-Prode/1.0',
      'Accept': 'application/json'
    }
  };

  try {
    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json`;
    const parseResponse = await fetch(parseUrl, fetchOptions);
    const parseData = await parseResponse.json();

    if (!parseData.parse || !parseData.parse.text) {
      return null;
    }

    const html = parseData.parse.text['*'];
    const svgMatches = html.match(/\/\/upload\.wikimedia\.org\/wikipedia\/[^"'\s]+\.svg/gi);

    if (!svgMatches) {
      console.log('  No SVG files found');
      return null;
    }

    console.log(`  Found ${svgMatches.length} SVG files`);

    const prioritizedSvgs = [];
    const otherSvgs = [];

    for (const match of svgMatches) {
      const filename = match.toLowerCase();
      // Extract just the filename (last part after /)
      const filenameOnly = filename.split('/').pop() || filename;

      if (filename.includes('flag') || filename.includes('coat_of_arms')) {
        console.log(`  Skipped (flag): ${match}`);
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
        console.log(`  Skipped (infrastructure): ${match}`);
        continue;
      }

      // Skip kit/uniform pieces
      if (filenameOnly.includes('kit_left_arm') ||
          filenameOnly.includes('kit_right_arm') ||
          filenameOnly.includes('kit_body') ||
          filenameOnly.includes('kit_shorts') ||
          filenameOnly.includes('kit_socks')) {
        console.log(`  Skipped (kit): ${match}`);
        continue;
      }

      // Skip medals and generic sports icons
      if (filenameOnly.includes('medal') ||
          filenameOnly.includes('soccerball_shade') ||
          filenameOnly.includes('soccer_ball')) {
        console.log(`  Skipped (icon): ${match}`);
        continue;
      }

      if (filename.includes('logo') || filename.includes('crest') ||
          filename.includes('badge') || filename.includes('emblem') ||
          filename.includes('association') || filename.includes('national')) {
        console.log(`  Priority: ${match}`);
        prioritizedSvgs.push(match);
      } else {
        console.log(`  Other: ${match}`);
        otherSvgs.push(match);
      }
    }

    const orderedSvgs = [...prioritizedSvgs, ...otherSvgs];

    if (orderedSvgs.length > 0) {
      let svgUrl = 'https:' + orderedSvgs[0];
      svgUrl = svgUrl.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
      return svgUrl;
    }

    return null;
  } catch (error) {
    console.error(`  Error:`, error.message);
    return null;
  }
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    const options = {
      headers: {
        'User-Agent': 'Qatar-Prode/1.0',
        'Accept': 'image/svg+xml'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
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

async function testCountry(countryName) {
  console.log(`\n=== Testing: ${countryName} ===`);

  const pageTitle = await findAssociationPage(countryName);
  if (!pageTitle) {
    console.log('✗ No association page found');
    return;
  }

  const logoUrl = await fetchLogoFromPage(pageTitle);
  if (!logoUrl) {
    console.log('✗ No logo found');
    return;
  }

  console.log(`  Logo URL: ${logoUrl}`);

  const filename = `${countryName.toLowerCase().replace(/\s+/g, '-')}.svg`;
  const filepath = path.join(ICONS_DIR, filename);

  try {
    await downloadFile(logoUrl, filepath);
    console.log(`✓ Downloaded to: ${filename}`);
  } catch (error) {
    console.log(`✗ Download failed: ${error.message}`);
  }
}

(async () => {
  await testCountry('Austria');
  await new Promise(r => setTimeout(r, 1000));
  await testCountry('Mexico');
  await new Promise(r => setTimeout(r, 1000));
  await testCountry('South Korea');
})();
