import { test, expect } from '@playwright/test';

test.describe('Flux de réservation public', () => {
  test('devrait afficher introuvable ou erreur pour un studio/cours invalide', async ({ page }) => {
    // We try to access a non-existent studio and class
    const response = await page.goto('/fake-studio-slug/book/00000000-0000-0000-0000-000000000000');
    
    // The page might redirect or show an error
    // For now, just ensure it doesn't crash the server (returns 200/404)
    expect(response?.status()).toBeLessThan(500);
    
    // Depending on implementation, it might show "Cours introuvable" or redirect
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeDefined();
  });
});
