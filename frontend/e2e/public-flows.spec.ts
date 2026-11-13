import { expect, test } from '@playwright/test';

test('landing page has one clear action and honest preview content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Break out of your campus bubble.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Join free' }).first()).toBeVisible();
  await expect(page.getByText('Sample interface preview').first()).toBeVisible();
  await expect(page.getByText('Aarav Patel')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Campuses' })).toHaveAttribute('href', '/campuses');
});

test('mobile public navigation opens and routes to campus directory', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.getByRole('link', { name: 'Campuses' }).click();
  await expect(page).toHaveURL(/\/campuses$/);
  await expect(page.getByRole('heading', { name: 'One city. Many campuses.' })).toBeVisible();
});

test('campus-specific page resolves its college', async ({ page }) => {
  await page.goto('/campus/pesu');
  await expect(page.getByRole('heading', { name: 'PES University' })).toBeVisible();
});

test('Build, Circles and Events routes show useful states', async ({ page }) => {
  await page.goto('/build');
  await expect(page.getByRole('heading', { name: 'Make something together.' })).toBeVisible();
  await page.goto('/circles');
  await expect(page.getByRole('heading', { name: 'Find your people.' })).toBeVisible();
  await page.goto('/events');
  await expect(page.getByRole('heading', { name: "What's happening around you?" })).toBeVisible();
});

test('Privacy and Terms pages are reachable', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy notice' })).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of use' })).toBeVisible();
});
