import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test('devrait charger la page d\'accueil et afficher les titres principaux', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page title is somewhat correct (assuming "Fitflow" or similar is in the title)
    await expect(page).toHaveTitle(/Fitloww/i);

    // Check for the main hero heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Check if there is a call to action button (usually "Commencer", "Essai", "Se connecter")
    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
  });

  test('devrait naviguer vers la page de connexion en cliquant sur le bouton de connexion', async ({ page }) => {
    await page.goto('/');
    
    const loginLink = page.locator('a[href="/login"]').first();
    await loginLink.click();

    // Wait for URL to change to /login
    await page.waitForURL('**/login');
    
    // Ensure there is a login form or heading
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
