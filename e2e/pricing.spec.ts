import { test, expect } from '@playwright/test';

test.describe('Page des Tarifs', () => {
  test('devrait charger la page des tarifs avec les plans Starter et Premium', async ({ page }) => {
    await page.goto('/pricing');
    
    // Vérifie que le titre est visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Des tarifs simples');

    // Vérifie que le plan Starter est présent
    const starterPlan = page.locator('h3:has-text("Starter")');
    await expect(starterPlan).toBeVisible();

    // Vérifie que le plan Premium est présent
    const premiumPlan = page.locator('h3:has-text("Premium")');
    await expect(premiumPlan).toBeVisible();
  });

  test('devrait rediriger vers l\'inscription manager lors du clic sur Premium', async ({ page }) => {
    await page.goto('/pricing');
    
    // Clique sur le bouton du plan Premium
    const subscribeButton = page.locator('a[href="/register?role=manager&plan=premium"]');
    await expect(subscribeButton).toBeVisible();
    await subscribeButton.click();

    // Vérifie que l'URL inclut bien le plan Premium et le rôle
    await page.waitForURL('**/register?role=manager&plan=premium');
    expect(page.url()).toContain('plan=premium');
  });
});
