import { chromium } from '@playwright/test';
import * as path from 'path';

async function runVisualAudit() {
  const email = 'gvinokur+3@gmail.com';
  const password = 'somepass';
  const baseUrl = 'https://qatar-prode-git-feature-story-243-gvinokurs-projects.vercel.app';

  console.log('🚀 Starting visual audit...');
  console.log(`📍 URL: ${baseUrl}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const baseDir = path.join(process.cwd(), 'docs/visual-audit/baseline');
  let count = 0;
  const pages: string[] = [];

  async function capture(name: string, mode: 'light' | 'dark') {
    const screenshotPath = path.join(baseDir, mode, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    count++;
    console.log(`  ✓ ${mode}/${name}.png`);
    return screenshotPath;
  }

  async function toggleTheme() {
    // Try to find and click theme switcher
    try {
      // Look for theme switcher button - could be an icon button or button with theme/mode text
      const themeSwitcher = page.locator('button').filter({ hasText: /theme|mode/i }).first();
      if (await themeSwitcher.count() > 0) {
        await themeSwitcher.click();
        await page.waitForTimeout(800);
        return true;
      }

      // Alternative: look for icon buttons that might be theme switchers
      const iconButtons = await page.locator('button[aria-label*="theme" i]').all();
      if (iconButtons.length > 0) {
        await iconButtons[0].click();
        await page.waitForTimeout(800);
        return true;
      }

      // Fallback: toggle dark class manually
      await page.evaluate(() => {
        document.documentElement.classList.toggle('dark');
      });
      await page.waitForTimeout(500);
      return true;
    } catch (error) {
      console.log('  ⚠️  Could not toggle theme, using manual class toggle');
      await page.evaluate(() => {
        document.documentElement.classList.toggle('dark');
      });
      await page.waitForTimeout(500);
      return true;
    }
  }

  try {
    // Navigate to home page
    console.log('1. Navigating to home page...');
    await page.goto(`${baseUrl}/en`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Try to login
    console.log('2. Attempting login...');
    try {
      // Look for login/signin button or link
      const loginButton = page.locator('button, a').filter({ hasText: /login|sign in/i }).first();
      if (await loginButton.count() > 0) {
        await loginButton.click();
        await page.waitForTimeout(1500);

        // Fill in credentials
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);

        // Submit form
        const submitButton = page.locator('button').filter({ hasText: /submit|login|sign in/i }).first();
        await submitButton.click();
        await page.waitForTimeout(4000);

        console.log('  ✓ Logged in successfully\n');
      } else {
        console.log('  ℹ️  No login button found, may already be logged in\n');
      }
    } catch (error) {
      console.log('  ⚠️  Login failed or not needed, continuing...\n');
    }

    // Capture home page
    console.log('📸 Capturing: Home Page');
    await page.goto(`${baseUrl}/en`);
    await page.waitForTimeout(2000);
    await capture('01-home', 'light');
    await toggleTheme();
    await capture('01-home', 'dark');
    await toggleTheme(); // Back to light
    pages.push('Home page');
    console.log('');

    // Try to find and navigate to a tournament
    console.log('🔍 Looking for tournaments...');
    const tournamentLinks = await page.locator('a[href*="/tournaments/"]').all();

    if (tournamentLinks.length > 0) {
      console.log(`  Found ${tournamentLinks.length} tournament(s)\n`);

      // Click first tournament
      await tournamentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Capture tournament games/predictions
      console.log('📸 Capturing: Tournament - Games');
      await capture('02-tournament-games', 'light');
      await toggleTheme();
      await capture('02-tournament-games', 'dark');
      await toggleTheme();
      pages.push('Tournament - Games/Predictions');
      console.log('');

      // Try to navigate to different tournament tabs
      const tabs = [
        { name: 'leaderboard', text: /leaderboard/i, filename: '03-tournament-leaderboard' },
        { name: 'stats', text: /stats/i, filename: '04-tournament-stats' },
        { name: 'groups', text: /groups|friend groups/i, filename: '05-tournament-groups' },
      ];

      for (const tab of tabs) {
        try {
          const tabButton = page.locator('button, a').filter({ hasText: tab.text }).first();
          if (await tabButton.count() > 0) {
            await tabButton.click();
            await page.waitForTimeout(2500);

            console.log(`📸 Capturing: Tournament - ${tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}`);
            await capture(tab.filename, 'light');
            await toggleTheme();
            await capture(tab.filename, 'dark');
            await toggleTheme();
            pages.push(`Tournament - ${tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}`);
            console.log('');
          }
        } catch (error) {
          console.log(`  ⚠️  Could not capture ${tab.name} tab\n`);
        }
      }
    } else {
      console.log('  ⚠️  No tournaments found\n');
    }

    // Try to navigate to friend groups
    console.log('🔍 Looking for friend groups...');
    try {
      const groupsLink = page.locator('a[href*="/friend-groups"]').first();
      if (await groupsLink.count() > 0) {
        await groupsLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log('📸 Capturing: Friend Groups');
        await capture('06-friend-groups', 'light');
        await toggleTheme();
        await capture('06-friend-groups', 'dark');
        await toggleTheme();
        pages.push('Friend Groups list');
        console.log('');
      }
    } catch (error) {
      console.log('  ⚠️  Could not access friend groups\n');
    }

    console.log('✅ Visual audit complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Pages captured: ${pages.length}`);
    console.log(`   - Total screenshots: ${count}`);
    console.log(`   - Light mode: ${count / 2}`);
    console.log(`   - Dark mode: ${count / 2}`);
    console.log(`\n📁 Screenshots saved to: docs/visual-audit/baseline/`);
    console.log(`\n📋 Next: Analyze screenshots and generate report`);

  } catch (error) {
    console.error('❌ Error during visual audit:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

runVisualAudit().catch(console.error);
