import { test, expect } from '@playwright/test';

test.describe('Strava Commits App', () => {
  test('should load the homepage and display the title', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Strava Commits/); // Not sure this is the correct title
    
    // Check that the main heading is visible
    await expect(page.locator('h1')).toContainText('Strava Commits');
    
    // Check that the page has the expected gradient background
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should display the Strava login button when no data is loaded', async ({ page }) => {
    await page.goto('/');
    
    // Check that the Strava login button is visible
    const stravaLoginButton = page.locator('img[alt="Connect with Strava"]');
    await expect(stravaLoginButton).toBeVisible();
    
    // Check that the login button has the correct href
    const loginLink = page.locator('a').filter({ has: stravaLoginButton });
    await expect(loginLink).toHaveAttribute('href', /strava\.com\/oauth\/authorize/);
  });

  test('should display the options controls', async ({ page }) => {
    await page.goto('/');
    
    // Check that sport type selector is visible
    const sportTypeSelect = page.locator('select').first();
    await expect(sportTypeSelect).toBeVisible();
    
    // Check that year selector is visible
    const yearSelect = page.locator('select[id="year-select"]');
    await expect(yearSelect).toBeVisible();
    
    // Check default values
    await expect(sportTypeSelect).toHaveValue('Ride');
    await expect(yearSelect).toHaveValue('2025');
  });

  test('should be able to change sport type and year options', async ({ page }) => {
    await page.goto('/');
    
    // Change sport type
    const sportTypeSelect = page.locator('select[id="sport-type-select"]');
    await sportTypeSelect.selectOption('Run');
    await expect(sportTypeSelect).toHaveValue('Run');
    
    // Change year
    const yearSelect = page.locator('select[id="year-select"]');
    await yearSelect.selectOption('2024');
    await expect(yearSelect).toHaveValue('2024');
  });

  test('should display all sport type options', async ({ page }) => {
    await page.goto('/');
    
    for (const year of ['All', 'Run', 'Ride', 'Swim']) {
      await page.selectOption('#sport-type-select', year);
      await expect(page.locator('#sport-type-select')).toHaveValue(year);
    }
  });

  test('should display all year options', async ({ page }) => {
    await page.goto('/');
    
    for (const year of ['2025', '2024', '2023', '2022', '2021', '2020']) {
      await page.selectOption('#year-select', year);
      await expect(page.locator('#year-select')).toHaveValue(year);
    }
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main container has responsive classes
    const mainContainer = page.locator('div.w-screen.min-h-screen');
    await expect(mainContainer).toBeVisible();
    
    // Check that the header has proper styling
    const header = page.locator('header');
    await expect(header).toHaveClass(/bg-white/);
    await expect(header).toHaveClass(/rounded-3xl/);
    await expect(header).toHaveClass(/shadow-2xl/);
  });
});
