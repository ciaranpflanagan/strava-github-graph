import { test, expect } from '@playwright/test';

test.describe('Accessibility and Responsiveness', () => {
  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check that form elements have proper labels
    const sportTypeSelect = page.locator('select').first();
    await expect(page.locator('label').filter({ hasText: 'Sport Type:' })).toBeVisible();
    
    const yearSelect = page.locator('select[id="year-select"]');
    await expect(page.locator('label[for="year-select"]')).toBeVisible();
    
    // Check that the Strava login image has alt text
    const stravaImage = page.locator('img[alt="Connect with Strava"]');
    await expect(stravaImage).toBeVisible();
    await expect(stravaImage).toHaveAttribute('alt', 'Connect with Strava');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that main elements are still visible and properly sized
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    
    // Check that form controls are still accessible
    const sportTypeSelect = page.locator('select').first();
    await expect(sportTypeSelect).toBeVisible();
    
    const yearSelect = page.locator('select[id="year-select"]');
    await expect(yearSelect).toBeVisible();
    
    // Check that the Strava button is still visible
    const stravaButton = page.locator('img[alt="Connect with Strava"]');
    await expect(stravaButton).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check that layout adapts properly
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check that the responsive classes are working
    const mainContainer = page.locator('div.w-screen.min-h-screen');
    await expect(mainContainer).toBeVisible();
  });

  test('should handle form interactions properly', async ({ page }) => {
    await page.goto('/');
    
    // Test sport type selection
    const sportTypeSelect = page.locator('select').first();
    await sportTypeSelect.click();
    await sportTypeSelect.selectOption('Run');
    await expect(sportTypeSelect).toHaveValue('Run');
    
    // Test year selection
    const yearSelect = page.locator('select[id="year-select"]');
    await yearSelect.click();
    await yearSelect.selectOption('2023');
    await expect(yearSelect).toHaveValue('2023');
    
    // Test that selections persist
    await expect(sportTypeSelect).toHaveValue('Run');
    await expect(yearSelect).toHaveValue('2023');
  });

  test('should have proper color contrast and styling', async ({ page }) => {
    await page.goto('/');
    
    // Check that text elements have proper styling
    const title = page.locator('h1');
    await expect(title).toHaveClass(/text-3xl/);
    await expect(title).toHaveClass(/font-bold/);
    await expect(title).toHaveClass(/text-gray-800/);
    
    // Check that form elements have proper styling
    const selects = page.locator('select');
    await expect(selects.first()).toHaveClass(/rounded-lg/);
    await expect(selects.first()).toHaveClass(/border/);
    await expect(selects.first()).toHaveClass(/px-4/);
    await expect(selects.first()).toHaveClass(/py-2/);
  });

  test('should handle focus states properly', async ({ page }) => {
    await page.goto('/');
    
    // Test focus on sport type select
    const sportTypeSelect = page.locator('select').first();
    await sportTypeSelect.focus();
    await expect(sportTypeSelect).toBeFocused();
    
    // Test focus on year select
    const yearSelect = page.locator('select[id="year-select"]');
    await yearSelect.focus();
    await expect(yearSelect).toBeFocused();
    
    // Test focus on Strava link
    const stravaLink = page.locator('a').filter({ has: page.locator('img[alt="Connect with Strava"]') });
    await stravaLink.focus();
    await expect(stravaLink).toBeFocused();
  });

  test('should maintain layout integrity with long usernames', async ({ page }) => {
    // Mock API response with a very long username
    await page.route('/api/activities', async route => {
      const mockData = {
        activities: [],
        username: 'This Is A Very Long Username That Should Test Layout Boundaries',
        athleteId: 12345
      };
      await route.fulfill({ json: mockData });
    });

    await page.goto('/?code=mock_code');
    
    // Check that the long username doesn't break the layout
    await expect(page.locator('h1')).toContainText('This Is A Very Long Username');
    
    // Ensure the header container still has proper styling
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/max-w-5xl/);
  });
});
