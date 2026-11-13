import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeModule = require('@axe-core/playwright');
const AxeBuilder = axeModule.default || axeModule;

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(8000);

  const routes = [
    '/', '/city', '/campus', '/commons', '/discover', '/build',
    '/messages', '/profile', '/passport', '/mentorship', '/privacy',
    '/terms', '/login', '/signup',
  ];

  for (const route of routes) {
    const response = await page.goto(new URL(route, baseUrl), { waitUntil: 'domcontentloaded' });
    if (!response || response.status() !== 200) {
      throw new Error(`Route ${route} returned HTTP ${response?.status() ?? 'no response'}`);
    }
    await page.locator('main').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) throw new Error(`Desktop horizontal overflow detected on ${route}`);

    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const severe = audit.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    if (severe.length) {
      const summary = severe.map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`).join('; ');
      throw new Error(`Accessibility issues on ${route}: ${summary}`);
    }
    console.log(`PASS desktop ${route} · ${audit.violations.length} non-blocking axe finding(s)`);
  }

  for (const route of ['/', '/city', '/discover', '/login', '/signup', '/mentorship']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(new URL(route, baseUrl), { waitUntil: 'domcontentloaded' });
    await page.locator('main').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) throw new Error(`Mobile horizontal overflow detected on ${route}`);
    const undersizedButtons = await page.evaluate(() =>
      [...document.querySelectorAll('button')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.height < 44;
      }).length
    );
    if (undersizedButtons) throw new Error(`Found ${undersizedButtons} buttons smaller than 44px on ${route}`);
    console.log(`PASS mobile ${route}`);
  }

  await page.goto(new URL('/', baseUrl), { waitUntil: 'domcontentloaded' });
  const themeButton = page.getByRole('button', { name: /Appearance:/ });
  await themeButton.click();
  const theme = await page.locator('html').getAttribute('data-theme');
  if (theme !== 'light') throw new Error('Appearance control did not switch to light mode');

  await page.goto(new URL('/discover', baseUrl), { waitUntil: 'domcontentloaded' });
  const campusPin = page.getByRole('button', { name: /Select PES University/ });
  await campusPin.waitFor();
  await campusPin.click();
  if (await campusPin.getAttribute('aria-pressed') !== 'true') {
    throw new Error('Campus map pin did not update its selected state');
  }

  await page.goto(new URL('/mentorship', baseUrl), { waitUntil: 'domcontentloaded' });
  if (!(await page.getByRole('heading', { name: 'Peer mentorship' }).count())) {
    throw new Error('Mentorship guest state did not render');
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motionDuration = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.animationDuration = '2s';
    document.body.appendChild(probe);
    const duration = getComputedStyle(probe).animationDuration;
    probe.remove();
    return duration.endsWith('ms') ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1000;
  });
  if (motionDuration > 0.1) throw new Error('Reduced-motion preference is not respected');

  await page.goto(new URL('/', baseUrl), { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Tab');
  const focusOutline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  if (focusOutline === 'none') throw new Error('Keyboard focus indicator is missing');

  console.log('PASS browser navigation, theme, map interaction, mentorship guest state and reduced motion');
} finally {
  await browser.close();
}
