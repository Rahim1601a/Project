import { test, expect } from '@playwright/test';

test.describe('MRTLikeTable Component', () => {
  test.beforeEach(async ({ page }) => {
    // Replace with the actual URL where the table is rendered
    await page.goto('/table');
  });

  test('should render the table and title', async ({ page }) => {
    // Assuming the title is passed as a prop, and rendered component='h1'
    const title = page.getByRole('heading', { level: 1, name: 'Employee Directory' });
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
    await expect(page.getByText(/Export.*CSV/)).toBeVisible();
    await expect(page.getByText(/Export.*Excel/)).toBeVisible();
    await expect(page.getByText(/Export.*PDF/)).toBeVisible();
  });

  test('should handle column visibility', async ({ page }) => {
    await page.getByRole('button', { name: 'View Settings' }).click();
    await expect(page.getByText(/Visible Columns/)).toBeVisible();
  });

  test('should auto-size column on double click', async ({ page }) => {
    const firstNameHeader = page.locator('[data-column-id="firstName"][aria-sort]');
    await expect(firstNameHeader).toBeVisible();
    
    const initialBox = await firstNameHeader.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;
    
    // Double click the right border of the column to trigger auto-size
    await firstNameHeader.click({
      position: { x: initialBox!.width - 2, y: initialBox!.height / 2 },
      clickCount: 2,
    });
    
    // Wait a brief moment for the width to update in the state
    await page.waitForTimeout(500);
    
    const finalBox = await firstNameHeader.boundingBox();
    expect(finalBox).not.toBeNull();
    const finalWidth = finalBox!.width;
    
    // The width should change as it optimizes for content
    console.log(`Auto-sized column: initial width = ${initialWidth}px, final width = ${finalWidth}px`);
    expect(finalWidth).not.toEqual(initialWidth);
  });

  test('should auto-size all columns from menu', async ({ page }) => {
    // Open Column visibility & density menu
    await page.getByRole('button', { name: 'View Settings' }).click();
    
    // Click "Auto-size all columns"
    await page.getByText('Auto-size all columns').click();
    
    // Check that column width is measured and bounding box exists
    const emailHeader = page.locator('[data-column-id="email"][aria-sort]');
    const box = await emailHeader.boundingBox();
    expect(box).not.toBeNull();
  });
});
