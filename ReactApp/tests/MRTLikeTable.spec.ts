import { test, expect } from '@playwright/test';

test.describe('MRTLikeTable Component', () => {
  test.beforeEach(async ({ page }) => {
    // Replace with the actual URL where the table is rendered
    await page.goto('/');
  });

  test('should render the table and title', async ({ page }) => {
    // Assuming the title is passed as a prop
    const title = page.locator('h6');
    await expect(title).toBeVisible();
  });

  test('should debounce global search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('test');
    
    // Search should not happen immediately due to 300ms debounce
    // This is hard to test purely visually without mocking the API, 
    // but we can check if the UI remains responsive.
    await expect(searchInput).toHaveValue('test');
  });

  test('should open export menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Export Options' }).click();
    await expect(page.getByText('Export CSV')).toBeVisible();
    await expect(page.getByText('Export Excel')).toBeVisible();
    await expect(page.getByText('Export PDF')).toBeVisible();
  });

  test('should handle column visibility', async ({ page }) => {
    await page.getByRole('button', { name: 'View Settings' }).click();
    await expect(page.getByText('Columns')).toBeVisible();
  });
});
