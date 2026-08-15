import { test, expect } from '@playwright/test';

test.describe('Page de Contact', () => {
  test('devrait charger la page de contact et afficher l\'email', async ({ page }) => {
    await page.goto('/contact');
    
    // Vérifie que le titre principal est présent
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Parlons de votre');

    // Vérifie que l'adresse email est affichée
    const emailText = page.locator('text="fitflow887@gmail.com"');
    await expect(emailText).toBeVisible();

    // Vérifie la présence des boutons d'action
    const gmailButton = page.locator('text="Ouvrir dans Gmail"');
    await expect(gmailButton).toBeVisible();
  });

  test('devrait pouvoir retourner à la page d\'accueil', async ({ page }) => {
    await page.goto('/contact');
    
    // Clique sur le lien "Retour"
    const backLink = page.locator('a:has-text("Retour")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Vérifie que l'URL est revenue à l'accueil
    await page.waitForURL('**/');
    expect(page.url()).not.toContain('/contact');
  });
});
