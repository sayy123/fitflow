import { test, expect } from '@playwright/test';

test.describe('Pages Publiques & Réservation', () => {
  test('devrait pouvoir accéder à une page publique de studio sans erreur', async ({ page }) => {
    // Si l'application a une page d'accueil de studio
    const response = await page.goto('/demo-studio');
    // On s'assure juste que ça ne crash pas
    expect(response?.status()).toBeLessThan(500);
  });
});
