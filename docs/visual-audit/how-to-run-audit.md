# How to Run Visual Audit with Playwright

This guide explains how to use the automated visual audit system to capture screenshots of the application for design review, theme analysis, and regression testing.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Running the Audit](#running-the-audit)
6. [Analyzing Results](#analyzing-results)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

**Purpose:** Automated visual auditing using Playwright to capture full-page screenshots in both light and dark modes.

**Use Cases:**
- Pre-implementation baseline (before UI changes)
- Post-implementation verification (after UI changes)
- Theme color adoption analysis
- Visual regression testing
- Design review and documentation

**Script Location:** `scripts/visual-audit.ts`

**Output Location:** `docs/visual-audit/baseline/` (or custom directory)

---

## Prerequisites

### Required Dependencies

1. **Playwright** - Already installed in project
   ```bash
   npm list @playwright/test
   ```

2. **TypeScript** - For running .ts scripts
   ```bash
   npm list typescript
   ```

3. **Test Credentials** (Optional, for authenticated pages)
   - Email and password for test account
   - Store in `.env.local` or pass directly to script

### Environment Setup

Add to `.env.local` (optional, for authenticated audits):

```bash
# Playwright Test Credentials
PLAYWRIGHT_TEST_EMAIL=your-test-email@example.com
PLAYWRIGHT_TEST_PASSWORD=your-test-password
```

⚠️ **Security Note:** Never commit `.env.local` to git. Test credentials should be for a dedicated test account, not production user accounts.

---

## Quick Start

### 1. Basic Audit (Public Pages Only)

```bash
# Run visual audit script
npx tsx scripts/visual-audit.ts
```

This will:
- Launch Chromium browser (headless: false, visible for debugging)
- Navigate to configured URL (Vercel Preview or localhost)
- Capture screenshots of accessible pages
- Save to `docs/visual-audit/baseline/{light|dark}/`

### 2. Audit with Login (Authenticated Pages)

Update credentials in `scripts/visual-audit.ts`:

```typescript
const email = 'your-test-email@example.com';
const password = 'your-test-password';
```

Or load from environment:

```typescript
const email = process.env.PLAYWRIGHT_TEST_EMAIL;
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
```

### 3. Expected Output

```
🚀 Starting visual audit...
📍 URL: https://your-preview-url.vercel.app

1. Navigating to home page...
2. Attempting login...
  ✓ Logged in successfully

📸 Capturing: Home Page
  ✓ light/01-home.png
  ✓ dark/01-home.png

📸 Capturing: Tournament - Games
  ✓ light/02-tournament-games.png
  ✓ dark/02-tournament-games.png

✅ Visual audit complete!
📊 Summary:
   - Pages captured: 3
   - Total screenshots: 6
   - Light mode: 3
   - Dark mode: 3

📁 Screenshots saved to: docs/visual-audit/baseline/
```

---

## Configuration

### Script Configuration Options

Edit `scripts/visual-audit.ts` to customize:

```typescript
// 1. Target URL
const baseUrl = 'https://your-app-url.vercel.app';
// Or use localhost:
// const baseUrl = 'http://localhost:3000';

// 2. Test credentials (if needed)
const email = 'test@example.com';
const password = 'testpassword';

// 3. Viewport size
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 }
});
// Mobile viewport example:
// viewport: { width: 375, height: 667 }

// 4. Browser mode
const browser = await chromium.launch({
  headless: false  // Set to true for CI/CD
});

// 5. Output directory
const baseDir = path.join(process.cwd(), 'docs/visual-audit/baseline');
// For post-implementation:
// const baseDir = path.join(process.cwd(), 'docs/visual-audit/post-implementation');

// 6. Screenshot options
await page.screenshot({
  path: screenshotPath,
  fullPage: true  // Capture entire page, not just viewport
});
```

---

## Running the Audit

### Option 1: Direct Execution

```bash
npx tsx scripts/visual-audit.ts
```

### Option 2: Add NPM Script

Add to `package.json`:

```json
{
  "scripts": {
    "visual-audit": "tsx scripts/visual-audit.ts"
  }
}
```

Then run:

```bash
npm run visual-audit
```

### Option 3: Different Environments

```bash
# Localhost audit
BASE_URL=http://localhost:3000 npx tsx scripts/visual-audit.ts

# Vercel Preview audit
BASE_URL=https://your-preview.vercel.app npx tsx scripts/visual-audit.ts

# Production audit (use with caution)
BASE_URL=https://prodemundial.app npx tsx scripts/visual-audit.ts
```

Update script to read from environment:

```typescript
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
```

---

## Analyzing Results

### 1. Review Screenshots Manually

```bash
# Open baseline directory
open docs/visual-audit/baseline/light/
open docs/visual-audit/baseline/dark/
```

### 2. Create Analysis Report

Use the captured screenshots to document findings in:
`docs/visual-audit/pre-implementation-analysis.md`

Template sections:
- **Executive Summary** - Overall assessment
- **Pages Audited** - List of captured pages
- **Component Analysis** - Good vs. needs improvement
- **Quantitative Assessment** - Metrics and percentages
- **Recommendations** - Prioritized action items

### 3. Compare Before/After

After implementing changes, capture new screenshots:

```bash
# Update output directory in script:
const baseDir = path.join(process.cwd(), 'docs/visual-audit/post-implementation');

# Run audit again
npm run visual-audit

# Compare directories
diff -r docs/visual-audit/baseline/ docs/visual-audit/post-implementation/
```

Use image comparison tools:
- **ImageMagick:** `compare before.png after.png diff.png`
- **Visual Studio Code:** Side-by-side image comparison
- **Playwright Trace Viewer:** For detailed interaction analysis

---

## Customization

### Adding New Pages to Audit

Edit `scripts/visual-audit.ts` and add new page capture blocks:

```typescript
// Example: Capture leaderboard page
console.log('📸 Capturing: Tournament - Leaderboard');
await page.goto(`${baseUrl}/en/tournaments/1/leaderboard`);
await page.waitForTimeout(2000);
await capture('03-tournament-leaderboard', 'light');
await toggleTheme();
await capture('03-tournament-leaderboard', 'dark');
await toggleTheme();
pages.push('Tournament - Leaderboard');
console.log('');
```

### Customizing Theme Toggle

If your app has a specific theme switcher UI:

```typescript
async function toggleTheme() {
  // Option 1: Click theme switcher button
  const themeSwitcher = page.locator('[aria-label="Toggle theme"]');
  await themeSwitcher.click();
  await page.waitForTimeout(800);

  // Option 2: Use keyboard shortcut
  await page.keyboard.press('Control+Shift+D');
  await page.waitForTimeout(500);

  // Option 3: Manual class toggle (fallback)
  await page.evaluate(() => {
    document.documentElement.classList.toggle('dark');
  });
  await page.waitForTimeout(500);
}
```

### Capturing Specific Component States

```typescript
// Expand accordion before capture
await page.click('[data-testid="expand-groups"]');
await page.waitForTimeout(500);

// Scroll to specific section
await page.locator('#stats-section').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);

// Hover over element
await page.hover('[data-testid="tooltip-trigger"]');
await page.waitForTimeout(200);

// Then capture
await capture('component-state', 'light');
```

### Mobile Viewport Audit

```typescript
// Create mobile context
const mobileContext = await browser.newContext({
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
});
const mobilePage = await mobileContext.newPage();

// Capture mobile screenshots
const mobileDir = path.join(process.cwd(), 'docs/visual-audit/mobile');
// ... (same capture logic)
```

---

## Troubleshooting

### Issue: Login Fails

**Symptoms:** "Login failed or not needed, continuing..."

**Solutions:**
1. **Verify credentials** - Check email/password are correct
2. **Check selectors** - Update login form selectors:
   ```typescript
   // Generic selectors might not match
   await page.fill('input[type="email"]', email);

   // Use specific selectors instead
   await page.fill('[data-testid="email-input"]', email);
   ```
3. **Wait for navigation** - Add longer timeout after login:
   ```typescript
   await submitButton.click();
   await page.waitForLoadState('networkidle');
   await page.waitForTimeout(5000); // Increase if needed
   ```
4. **Check for redirects** - Verify post-login URL:
   ```typescript
   console.log('Current URL:', page.url());
   ```

### Issue: Theme Toggle Not Working

**Symptoms:** Light and dark screenshots look identical

**Solutions:**
1. **Verify theme implementation** - Check if `dark` class toggles on `<html>` element
2. **Increase wait time** - Theme transitions might need more time:
   ```typescript
   await page.waitForTimeout(1500); // Increase from 500ms
   ```
3. **Use manual toggle** - Skip UI button, toggle class directly:
   ```typescript
   await page.evaluate(() => {
     document.documentElement.classList.toggle('dark');
   });
   ```
4. **Check CSS** - Ensure dark mode styles are loaded

### Issue: Screenshots Are Blank/Partial

**Symptoms:** White/empty screenshots or content cut off

**Solutions:**
1. **Wait for content** - Add network idle wait:
   ```typescript
   await page.goto(url, { waitUntil: 'networkidle' });
   ```
2. **Increase timeout** - Content might load slowly:
   ```typescript
   await page.waitForTimeout(5000);
   ```
3. **Wait for specific element** - Target key component:
   ```typescript
   await page.waitForSelector('[data-testid="tournament-list"]');
   ```
4. **Check viewport** - Ensure viewport is large enough
5. **Disable animations** - Speed up rendering:
   ```typescript
   await page.addStyleTag({ content: '* { animation: none !important; }' });
   ```

### Issue: "Navigation Timeout" Errors

**Symptoms:** Script crashes with timeout error

**Solutions:**
1. **Increase timeout** - Default is 30s:
   ```typescript
   await page.goto(url, { timeout: 60000 }); // 60 seconds
   ```
2. **Check URL** - Verify the URL is accessible
3. **Handle failures gracefully**:
   ```typescript
   try {
     await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
   } catch (error) {
     console.log('⚠️  Navigation failed, using current page');
   }
   ```

---

## Best Practices

### 1. Pre-Implementation Baseline

**Always capture baseline before making changes:**

```bash
# 1. Checkout feature branch
git checkout feature/story-243

# 2. Deploy to Vercel Preview
git push origin feature/story-243

# 3. Get preview URL from PR
PR_URL=$(gh pr view --json url -q .url)

# 4. Update script with preview URL
# Edit scripts/visual-audit.ts

# 5. Run audit
npm run visual-audit

# 6. Commit screenshots
git add docs/visual-audit/baseline/
git commit -m "docs: add visual audit baseline for story #243"
```

### 2. Consistent Environment

**Use the same environment for before/after comparisons:**
- Same viewport size
- Same browser version
- Same Playwright version
- Same test account state (clear data between runs)

### 3. Comprehensive Coverage

**Capture all critical pages:**
- ✅ Home/landing pages
- ✅ Main feature pages (tournaments, groups, etc.)
- ✅ Form pages (login, predictions, settings)
- ✅ Empty states (no data scenarios)
- ✅ Error states (404, 500, validation errors)
- ✅ Mobile responsive views

### 4. Naming Conventions

**Use numbered, descriptive filenames:**
```
01-home.png
02-tournament-games.png
03-tournament-leaderboard.png
04-tournament-stats.png
05-friend-groups-list.png
06-friend-groups-detail.png
```

**Use subdirectories for organization:**
```
baseline/light/
baseline/dark/
baseline/mobile/
post-implementation/light/
post-implementation/dark/
```

### 5. Documentation

**Always create analysis reports:**
- Document what you found
- Quantify improvements (% before/after)
- List specific components affected
- Note any regressions or issues

### 6. Version Control

**Commit screenshots selectively:**
- ✅ Baseline screenshots (reference point)
- ✅ Post-implementation screenshots (proof of changes)
- ⚠️ Consider .gitignore for large screenshot sets
- ✅ Always commit analysis reports (.md files)

### 7. CI/CD Integration

**For automated regression testing:**

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on: [pull_request]

jobs:
  visual-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install chromium
      - name: Run visual audit
        run: npm run visual-audit
        env:
          BASE_URL: ${{ secrets.PREVIEW_URL }}
          PLAYWRIGHT_TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          PLAYWRIGHT_TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: docs/visual-audit/
```

---

## Example Workflow: Theme Analysis

**Complete workflow for analyzing theme color adoption:**

### Step 1: Capture Baseline

```bash
# Get Vercel Preview URL
PREVIEW_URL=$(gh pr view 247 --json url -q .url)

# Update script
# Edit scripts/visual-audit.ts:
# const baseUrl = '<preview-url>';

# Run audit
npm run visual-audit

# Verify output
ls -la docs/visual-audit/baseline/light/
ls -la docs/visual-audit/baseline/dark/
```

### Step 2: Analyze Screenshots

```bash
# Read screenshots (Claude Code or manual review)
# Look for:
# - Components using theme colors
# - Components using hardcoded colors
# - Missing color props
# - Inconsistent styling

# Create analysis report
# File: docs/visual-audit/pre-implementation-analysis.md
```

### Step 3: Implement Changes

```bash
# Follow implementation plan
# Update components to use theme colors
# Test changes locally
```

### Step 4: Capture Post-Implementation

```bash
# Update output directory
# Edit scripts/visual-audit.ts:
# const baseDir = 'docs/visual-audit/post-implementation';

# Deploy changes
git push origin feature/story-243

# Wait for Vercel deployment
# Update script with new preview URL

# Run audit again
npm run visual-audit
```

### Step 5: Compare Results

```bash
# Side-by-side comparison
code docs/visual-audit/baseline/light/01-home.png
code docs/visual-audit/post-implementation/light/01-home.png

# Create comparison report
# File: docs/visual-audit/comparison-report.md
# Document:
# - Before/after screenshots
# - Quantitative improvements
# - Visual enhancements
# - Any regressions
```

---

## Maintenance

### Updating the Audit Script

When app structure changes, update:
1. **Page URLs** - If routes change
2. **Selectors** - If UI components change
3. **Navigation flow** - If app flow changes
4. **Login process** - If auth flow changes

### Versioning

Consider versioning the audit script:
```
scripts/visual-audit-v1.ts  (original)
scripts/visual-audit-v2.ts  (updated for new UI)
```

---

## Resources

- **Playwright Documentation:** https://playwright.dev
- **Screenshot Testing Guide:** https://playwright.dev/docs/screenshots
- **MUI Theme Documentation:** https://mui.com/material-ui/customization/theming/
- **Project Theme Config:** `app/components/context-providers/theme-provider.tsx`

---

## Support

For issues or questions about the visual audit system:
1. Check this documentation first
2. Review Playwright documentation
3. Check existing analysis reports for examples
4. Consult project maintainers

---

**Last Updated:** 2026-03-03
**Script Version:** 1.0
**Compatible With:** Playwright ^1.40.0, Next.js 15.3
