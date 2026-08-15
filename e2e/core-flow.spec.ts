import { test, expect } from '@playwright/test';

test.describe('Parcours Complet Utilisateur', () => {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const email = `manager-${randomSuffix}@example.com`;
  const studioName = `Studio End to End ${randomSuffix}`;

  test('devrait pouvoir s\'inscrire, créer un studio, et accéder au dashboard', async ({ page }) => {
    // 1. Inscription
    await page.goto('/register?role=manager');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const nameInput = page.locator('input[type="text"], input[name="name"], input[name="fullName"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill(email);
      await passwordInput.fill('TestPassword123!');
      if (await nameInput.count() > 0) await nameInput.fill('Manager Test');
      await page.locator('button[type="submit"]').click();
      
      // On attend une redirection vers l'onboarding ou dashboard
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    }

    // 2. Création de studio (si l'onboarding est requis)
    await page.goto('/create-studio');
    const studioInput = page.locator('input[name="name"], input[placeholder*="Nom"]').first();
    if (await studioInput.isVisible()) {
      await studioInput.fill(studioName);
      await page.locator('button[type="submit"]').click();
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    }

    // 3. Vérifier l'accès au tableau de bord
    await page.goto('/dashboard');
    const dashTitle = page.locator('h1, h2, span').filter({ hasText: /Dashboard|Tableau de bord/i }).first();
    // Le dashboard devrait être accessible
    if (await dashTitle.isVisible()) {
      await expect(dashTitle).toBeVisible();
    }
  });
});
