import { test, expect } from '@playwright/test';

test.describe('Admin Panel UI Tests', () => {
  test('login page loads correctly', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore 401 errors - expected when checking auth without session
        if (!msg.text().includes('401')) {
          consoleErrors.push(msg.text());
        }
      }
    });

    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');

    // Check title
    await expect(page).toHaveTitle(/App Socios/);

    // Check form elements
    await expect(page.locator('text=Panel de Administración')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    expect(consoleErrors.length).toBe(0);
  });

  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/login/);
  });

  test('API connection check - backend responds', async ({ page }) => {
    // Try to access dashboard which should fail and redirect
    const response = await page.request.get('http://localhost:3000/api/admin/dashboard');
    // Should get 401 since we're not authenticated
    expect(response.status()).toBe(401);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');

    // Fill invalid credentials
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Wait for response - check for any error alert
    await page.waitForTimeout(3000);

    // Check for error message (could be "inválidos" or similar)
    const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false);
    expect(errorVisible).toBe(true);
  });
});
